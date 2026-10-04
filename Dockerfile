# Multi-stage production build for SyndicateOS Full-Stack ERP
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build production frontend bundle into /dist
RUN npm run build

# ==============================================================================
# Production Runtime Stage
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy dependencies and application
COPY package*.json ./
RUN npm install --omit=dev && npm install tsx

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/init.sql ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
