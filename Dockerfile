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

COPY package.json package-lock.json ./
RUN npm install --omit dev

# Copy ONLY the necessary files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Ensure uploads folder exists
RUN mkdir -p public/uploads

EXPOSE 3000
CMD ["npm", "start"]
