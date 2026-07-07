# Build stage: Bun als Package Manager & Task Runner (kein npm)
FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Runtime stage: nginx serviert das PWA-Bundle und proxied /api zum Backend
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/foundry-frontend/browser /usr/share/nginx/html
EXPOSE 80
