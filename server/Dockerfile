FROM node:20.18.0-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

FROM node:20.18.0-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app /app

EXPOSE 5000
CMD ["node", "server.js"]
