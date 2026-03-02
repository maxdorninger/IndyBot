FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Declare build-time arguments and expose them as env vars so that
# SvelteKit / Vite can inline $env/static/* values during the build.
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG PRIVATE_SUPABASE_API_KEY
ARG PRIVATE_INDY_ENCRYPTION_KEY
ARG PUBLIC_INDY_API_URL
ARG CRON_SECRET

ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV PUBLIC_SUPABASE_PUBLISHABLE_KEY=$PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV PRIVATE_SUPABASE_API_KEY=$PRIVATE_SUPABASE_API_KEY
ENV PRIVATE_INDY_ENCRYPTION_KEY=$PRIVATE_INDY_ENCRYPTION_KEY
ENV PUBLIC_INDY_API_URL=$PUBLIC_INDY_API_URL
ENV CRON_SECRET=$CRON_SECRET

RUN pnpm run build

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "build/index.js"]
