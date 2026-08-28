FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/calculator ./cmd/server

FROM alpine:3.20
RUN adduser -D -H -u 10001 app
COPY --from=build /out/calculator /usr/local/bin/calculator
USER app
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/calculator"]
