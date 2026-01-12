FROM denoland/deno:2.1.4

WORKDIR /app

# Copy deno.json for import maps
COPY apps/agent/deno.json ./apps/agent/

# Copy agent source
COPY apps/agent/src ./apps/agent/src

WORKDIR /app/apps/agent

# Install dependencies and cache
RUN deno install --allow-scripts
RUN deno cache src/index.ts

EXPOSE 50051

CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "--allow-run", "--allow-sys", "src/index.ts"]
