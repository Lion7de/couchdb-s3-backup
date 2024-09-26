import dotenv from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import nano from "nano";
import fs from "fs";
import { RateLimiterMemory } from "rate-limiter-flexible";
dotenv.config();

const bucketName = process.env.S3_BUCKET;

const config = {
  correctClockSkew: true,
  credentials: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
  },
  region: process.env.S3_REGION,
  // endpoint: process.env.S3_URL,
  sslEnabled: true,
  forcePathStyle: true,
};

const s3Client = new S3Client(config);

const couchClient = nano({
  url: process.env.COUCHDB_URL,
  //   requestDefaults: {
  //     auth: {
  //       user: process.env.COUCHDB_USER,
  //       pass: process.env.COUCHDB_PASSWORD,
  //     },
  //   },
});

const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.REQUEST_LIMIT_POINTS || "5"), // Number of requests
  duration: parseInt(process.env.REQUEST_LIMIT_DURATION || "1"), // Per second
});

async function fetchDatabases() {
  try {
    const databases = await couchClient.db.list();
    return databases;
  } catch (err) {
    console.error("Error fetching databases:", err);
    return [];
  }
}

async function backupDatabase(dbName) {
  try {
    const db = couchClient.db.use(dbName);

    // const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    // const fileName = `${dbName}-${timestamp}.json`;
    const fileName = `${dbName}.json`;
    const filePath = `tmp/${fileName}`;

    const writeStream = fs.createWriteStream(filePath);

    const stream = db.listAsStream({ include_docs: true });
    stream.pipe(writeStream);

    // Wait for the stream to finish
    await new Promise((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    writeStream.end();

    // Upload to S3
    const params = {
      Bucket: bucketName,
      Key: `${fileName}`,
      Body: filePath,
      ContentType: "application/json",
    };

    const putCommand = new PutObjectCommand(params);
    await s3Client.send(putCommand);

    await fs.unlinkSync(filePath);

    console.log(`Backup successful for ${dbName}`);
  } catch (err) {
    console.error(`Error backing up ${dbName}:`, err);
  }
}

async function backupAllDatabases() {
  const databases = await fetchDatabases();

  for (const dbName of databases) {
    try {
      const rateLimiterSuccessResponse = await rateLimiter.consume(1);

      await backupDatabase(dbName);

      if (rateLimiterSuccessResponse.remainingPoints === 0) {
        console.error(
          `Rate limit reached. Waiting for ${rateLimiterSuccessResponse.msBeforeNext}ms second`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, rateLimiterSuccessResponse.msBeforeNext)
        );
      }
    } catch (rateLimiterResponse) {
      console.log(
        `Rate limited. Waiting for ${rateLimiterResponse.msBeforeNext}ms second`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, rateLimiterResponse.msBeforeNext + 100)
      );
      console.log("Retrying backup for", dbName);
      await backupDatabase(dbName);
    }
  }
}

backupAllDatabases();
