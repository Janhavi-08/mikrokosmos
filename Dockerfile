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

# Copy only necessary build output
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

# DO NOT COPY public here — it will be mounted as a volume
# COPY --from=builder /app/public ./public

# Ensure runtime data folder exists
RUN mkdir -p ./src/data
RUN chmod -R 755 ./src

EXPOSE 3000

CMD ["npm", "start"]
