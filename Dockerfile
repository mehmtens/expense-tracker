FROM golang:1.26-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /expense-tracker .

FROM alpine:3.22

WORKDIR /app
COPY --from=build /expense-tracker /expense-tracker

EXPOSE 8080

CMD ["/expense-tracker"]
