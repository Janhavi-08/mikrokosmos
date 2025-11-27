# 1. Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# 2. Run Stage
FROM node:22-alpine AS runner

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN mkdir -p public/uploads

EXPOSE 3000

CMD ["npm", "run", "dev"]
