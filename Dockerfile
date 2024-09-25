# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json
COPY ["package.json", "yarn.lock*", "./"]

# Install necessary packages
RUN yarn install && yarn cache clean

# Copy the rest of the application code
COPY . .

# Add cron if required for cron-based job
RUN apt-get update && apt-get install -y cron

# Start the cron service
CMD yarn start
