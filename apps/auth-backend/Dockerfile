FROM node:24-alpine AS base
RUN npx yarn set version 4.9.1

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .
RUN yarn dlx turbo@^2.5.4 prune @lin/auth-backend --docker

FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=builder /app/out/json/ .
RUN yarn install

COPY --from=builder /app/out/full/ .
RUN yarn build

FROM base AS runner
WORKDIR /app

ARG AUTH_BACKEND_PORT=3001
ENV AUTH_BACKEND_PORT=$AUTH_BACKEND_PORT

RUN addgroup --system --gid 1001 expressjs
RUN adduser --system --uid 1001 expressjs
USER expressjs

COPY --from=installer /app .

# ENTRYPOINT ["tail", "-f", "/dev/null"]
CMD node apps/auth-backend/dist/index.js
