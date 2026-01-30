FROM denoland/deno:2.1.4

WORKDIR /app

# Install ffmpeg for video frame extraction
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY deno.json .

# Cache dependencies
RUN deno install

# Copy source
COPY src/ src/
COPY .skills/ .skills/

# Compile
RUN deno cache src/main.ts

# Run
EXPOSE 8001
CMD ["deno", "run", "--allow-all", "src/main.ts"]
