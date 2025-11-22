# 1. Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# 2. Run Stage
FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy the entire source tree so runtime has access to `src/` (including `src/data`)
COPY --from=builder /app/src ./src

# Ensure src/data exists and is readable/writable by the container runtime
RUN mkdir -p ./src/data || true
RUN chmod -R 755 ./src || true

EXPOSE 3000

CMD ["npm", "start"]
