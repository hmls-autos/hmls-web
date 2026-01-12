FROM oven/bun:latest

WORKDIR /app

# Copy workspace root files and all package.json files
COPY package.json bun.lock .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/proto/package.json ./packages/proto/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

WORKDIR /app/apps/api

EXPOSE 8000

CMD ["bun", "run", "src/index.ts"]
