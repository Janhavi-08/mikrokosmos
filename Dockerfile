# 1. Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# 2. Run Stage
FROM node:22-alpine AS runner

WORKDIR /app

# Copy ONLY production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/package.json ./package.json

# Create uploads folder
RUN mkdir -p public/uploads && chmod -R 777 public/uploads

EXPOSE 3000
CMD ["npm", "start"]
