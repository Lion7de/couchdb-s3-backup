# CouchDB S3 Backup

This repository contains a script for backing up CouchDB databases to Amazon S3.

## Prerequisites

Before running the script, make sure you have the following:

- Node 18 installed
- CouchDB installed and running
- AWS S3 credentials

## Installation

1. Clone this repository to your local machine.
2. Install the required dependencies by running `yarn install`.
3. Configure the script by editing the `.env.example` file and providing your CouchDB and S3 credentials.
4. Run the script using `yarn start` or simply run the docker container.

## Usage

You need to set the following variables in the environment file to configure the backup script:

- S3_KEY
- S3_SECRET
- S3_BUCKET
- S3_REGION

- COUCHDB_URL
- COUCHDB_USER
- COUCHDB_PASSWORD

- REQUEST_LIMIT_POINTS
- REQUEST_LIMIT_DURATION

Example usage:

```
yarn start
```

## How To Use

There are multiple options to run the cronjob via Docker:

- Easypanel Cronjob
- Gitlab CI/CD (scheduled)
- ... anywhere you can schedule a docker process

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
