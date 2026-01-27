FROM denoland/deno:2.1.4

WORKDIR /app

# Copy API manifest/lock first to leverage Docker layer caching
COPY apps/api/deno.json ./deno.json
COPY apps/api/deno.lock ./deno.lock

# Copy API source
COPY apps/api/src ./src

# Pre-cache dependencies so runtime containers spin up fast
RUN deno cache --lock=deno.lock src/index.ts

EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "--allow-run", "--allow-sys", "src/index.ts"]
