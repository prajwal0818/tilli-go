# render-worker.Dockerfile
# Worker for Render free-tier deployment.
# Identical to worker.Dockerfile but adds a minimal HTTP health server
# so Render treats it as a healthy Web Service (free tier requires HTTP binding).

# ---- Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (including devDependencies for tsc)
COPY worker/package*.json ./
RUN npm ci

# Copy prisma schema from backend and generate client
COPY backend/prisma ./prisma
RUN npx prisma generate

# Copy application source and compile TypeScript
COPY worker/ .
RUN npm run build

# ---- Production ----
FROM node:20-alpine

# tini for proper PID 1 signal handling
RUN apk add --no-cache tini openssl

WORKDIR /app

# Install production dependencies only
COPY worker/package*.json ./
RUN npm ci --omit=dev

# Copy prisma schema from backend and generate client
COPY backend/prisma ./prisma
RUN npx prisma generate

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Inline health server script — listens on $PORT so Render considers the service alive.
# The actual BullMQ worker runs as a child process alongside this server.
RUN cat > /app/render-start.js << 'SCRIPT'
const { spawn } = require("child_process");
const http = require("http");

const PORT = process.env.PORT || 10000;

// Start the real worker as a child process
const worker = spawn("node", ["dist/index.js"], {
  stdio: "inherit",
  env: process.env,
});

worker.on("exit", (code) => {
  console.log(`Worker exited with code ${code}`);
  process.exit(code ?? 1);
});

// Minimal health server for Render
const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Render health server listening on port ${PORT}`);
});

// Forward signals to the worker for graceful shutdown
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    console.log(`${signal} received — forwarding to worker`);
    worker.kill(signal);
  });
}
SCRIPT

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 10000

ENTRYPOINT ["tini", "--"]
CMD ["node", "render-start.js"]
