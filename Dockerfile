# Use official Node.js LTS image
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and set ownership
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001

# Development stage
FROM base AS development
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN chown -R nodeuser:nodejs /app
USER nodeuser
EXPOSE 3000
#CMD ["dumb-init", "npm", "run", "dev"]
CMD ["npm", "run", "dev"]

# Production dependencies stage
FROM base AS deps
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Copy production dependencies
COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodeuser:nodejs . .

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const options={hostname:'localhost',port:3000,path:'/health',timeout:2000};const req=http.request(options,(r)=>{process.exit(r.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.end();"

# Start the application
#CMD ["dumb-init", "node", "src/index.js"]
CMD ["npm", "start"]