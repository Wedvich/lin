FROM node:24.1.0-alpine AS base
RUN corepack enable

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .
RUN yarn dlx turbo@^2.5.4 prune @lin/app-frontend @lin/auth-frontend --docker

FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=builder /app/out/json/ .
RUN yarn install

COPY --from=builder /app/out/full/ .
RUN yarn build

FROM nginx:1.27.5-alpine-slim AS runner
WORKDIR /app

COPY --from=installer /app/apps/app-frontend/dist /usr/share/nginx/html/app
COPY --from=installer /app/apps/auth-frontend/dist /usr/share/nginx/html/auth

COPY apps/nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

# ENTRYPOINT ["tail", "-f", "/dev/null"]
CMD nginx
