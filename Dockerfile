# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build Vite frontend and Express server bundle
RUN npm run build

# Stage 2: Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy compiled build output from builder stage
COPY --from=builder /app/dist ./dist

# Create data directory for persistent SQLite database storage
RUN mkdir -p /app/data

# Expose port 3000
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
