# Build stage
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for building)
RUN npm ci

# Copy the rest of the application code to the working directory
COPY . .

# Build the application for production
RUN npm run build

# Production stage
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Install serve globally to serve the built files
RUN npm install -g serve

# Copy the built files from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["serve", "-s", "dist", "-l", "3000"]
