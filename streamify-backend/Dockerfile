# syntax=docker/dockerfile:1
FROM golang:1.24.4

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum first for caching
COPY go.mod ./ 
RUN go mod download

# Copy rest of the app
COPY . .

# Build the Go app
RUN go build -o main .

# Run the app
CMD ["./main"]
