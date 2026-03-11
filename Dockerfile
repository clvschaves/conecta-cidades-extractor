# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install pnpm and dependencies
RUN npm install -g pnpm@10.4.1
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/uploads ./uploads

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start application
CMD ["node", "dist/index.prod.js"]
