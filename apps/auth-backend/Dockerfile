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

RUN addgroup --system --gid 1001 expressjs
RUN adduser --system --uid 1001 expressjs
USER expressjs

COPY --from=installer /app .

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:$AUTH_BACKEND_PORT/health || exit 1

# ENTRYPOINT ["tail", "-f", "/dev/null"]
CMD node apps/auth-backend/dist/index.js
