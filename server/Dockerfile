# Server (multi-stage) - node 20.18.0-alpine
FROM node:20.18.0-alpine AS builder
WORKDIR /app

# Copy package files for caching
COPY package*.json ./

# Install production deps only (no dev)
RUN npm ci --omit=dev

# Copy app source
COPY . .

# Final image
FROM node:20.18.0-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy built app and production node_modules from builder
COPY --from=builder /app /app

# Expose the port your server listens on
EXPOSE 5000

# Run the server
CMD ["node", "server.js"]
