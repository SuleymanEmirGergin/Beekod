# ============================================
# Builder Stage - TypeScript Compilation
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency files first (better caching)
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (devDependencies needed for build!)
RUN npm ci && npm cache clean --force

# Copy source code
COPY src ./src
COPY db ./db
COPY scripts ./scripts

# Build TypeScript to JavaScript
RUN npm run build

# Create a separate production node_modules
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force && \
    mv node_modules prod_node_modules

# ============================================
# Runner Stage - Production Runtime
# ============================================
FROM node:18-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init tini

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/logs /app/storage /app/temp && \
    chown -R nodejs:nodejs /app

WORKDIR /app

# Copy package.json for metadata
COPY --chown=nodejs:nodejs package.json ./

# Copy ONLY production dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/prod_node_modules ./node_modules

# Copy compiled application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy database files (if needed for migrations)
COPY --from=builder --chown=nodejs:nodejs /app/db ./db

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Environment variables (can be overridden)
ENV NODE_ENV=production \
    PORT=3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]
