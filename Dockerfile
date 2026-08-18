FROM golang:1.26-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /expense-tracker .

FROM alpine:3.22

WORKDIR /app
RUN apk add --no-cache ca-certificates && addgroup -S app && adduser -S app -G app
COPY --from=build /expense-tracker /expense-tracker
COPY --from=migrate/migrate:v4.19.1 /usr/local/bin/migrate /usr/local/bin/migrate
COPY migrations /app/migrations
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint
RUN chmod +x /usr/local/bin/docker-entrypoint
USER app

EXPOSE 8080

ENTRYPOINT ["docker-entrypoint"]
