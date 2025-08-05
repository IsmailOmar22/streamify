# Build stage
FROM golang:1.24.4 AS builder
WORKDIR /app

# Install FFmpeg dependencies
RUN apt-get update && apt-get install -y wget unzip xz-utils

# Download and extract FFmpeg static build
RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz && \
    tar -xf ffmpeg-release-amd64-static.tar.xz && \
    cp ffmpeg-*-static/ffmpeg /usr/local/bin/

COPY . .
RUN go build -o worker

# Final image
FROM gcr.io/distroless/base-debian12
WORKDIR /app

# Copy compiled Go binary
COPY --from=builder /app/worker .

# Copy ffmpeg binary from build stage
COPY --from=builder /usr/local/bin/ffmpeg /usr/local/bin/ffmpeg

ENTRYPOINT ["./worker"]
