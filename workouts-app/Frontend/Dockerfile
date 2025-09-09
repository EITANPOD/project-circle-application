FROM node:18-alpine

# Set working directory
WORKDIR /app

# Accept API base URL at build time for browser calls
ARG VITE_API_BASE=""
ENV VITE_API_BASE=$VITE_API_BASE

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Show what we have before building
RUN echo "=== Before build ===" && ls -la

# Run TypeScript build first
RUN echo "=== Running TypeScript build ===" && npx tsc -b

# Run Vite build
RUN echo "=== Running Vite build (VITE_API_BASE=$VITE_API_BASE) ===" && npx vite build

# Show what we have after building
RUN echo "=== After build ===" && ls -la
RUN echo "=== Dist contents ===" && ls -la dist/ || echo "Dist folder not found!"

# Install serve to run the built application
RUN npm install -g serve

# Remove dev dependencies but keep the dist folder
RUN npm prune --production
RUN echo "=== After pruning ===" && ls -la
RUN echo "=== Dist still exists? ===" && ls -la dist/ || echo "Dist folder lost!"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Run the application
CMD ["serve", "-s", "dist", "-l", "3000"]