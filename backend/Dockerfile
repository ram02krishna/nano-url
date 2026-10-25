# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Install pnpm
RUN npm install -g pnpm

# Set the working directory in the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json pnpm-lock.yaml ./

# Install any needed packages
RUN pnpm install --prod

# Bundle app source
COPY . .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define the command to run your app
CMD ["node", "index.js"]
