# Backend Dockerfile - Fastify
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm install -g pnpm@11 && pnpm install --frozen-lockfile

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/src ./src
COPY --from=builder /app/packages/shared/dist ./packages/shared

USER api
EXPOSE 3001
ENV PORT=3001

CMD ["node", "dist/server.js"]