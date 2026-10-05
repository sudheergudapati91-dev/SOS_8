FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy application files
COPY . .

# Install dependencies and build client SPA
RUN npm install --legacy-peer-deps && npm run build

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
