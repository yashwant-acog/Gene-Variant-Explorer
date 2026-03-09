# =========================
# Stage 1: Builder
# =========================
FROM node:lts-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy full source
COPY . .

# Build Next.js app
RUN npm run build

# =========================
# Stage 2: Production Runtime
# =========================
FROM node:lts-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy only required artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/tsconfig.json ./

# Expose port
EXPOSE 3000

LABEL security="none"
LABEL description="Gene Variant Explorer Frontend"
LABEL user="Yashwant"
LABEL port="3000"

CMD ["npm", "start"]