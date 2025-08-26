# Use the official Golang image which is based on Debian.
# This single stage ensures all libraries are available.
FROM golang:1.24.4

# Install FFmpeg and its dependencies using the package manager.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg

# Set up the working directory
WORKDIR /app

# Copy Go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the Go application
RUN go build -o worker .

# Set the command to run the worker
CMD ["./worker"]