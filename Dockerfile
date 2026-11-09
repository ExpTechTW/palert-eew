FROM oven/bun:1.1.42-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ git

COPY package*.json ./
RUN bun install && \
    apk del python3 make g++ git

COPY . .

CMD ["bun", "index.js"]
