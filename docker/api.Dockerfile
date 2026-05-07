# ---- Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (including devDependencies for tsc)
COPY backend/package*.json ./
RUN npm ci

# Copy prisma schema and generate client
COPY backend/prisma ./prisma
RUN npx prisma generate

# Copy application source and compile TypeScript
COPY backend/ .
RUN npm run build

# ---- Production ----
FROM node:20-alpine

# tini for proper PID 1 signal handling
RUN apk add --no-cache tini openssl

WORKDIR /app

# Install production dependencies only
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy prisma schema and generate client
COPY backend/prisma ./prisma
RUN npx prisma generate

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker/api-entrypoint.sh /usr/local/bin/api-entrypoint.sh
RUN chmod +x /usr/local/bin/api-entrypoint.sh

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001

ENTRYPOINT ["tini", "--"]
CMD ["api-entrypoint.sh"]
