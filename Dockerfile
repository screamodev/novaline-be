# Strapi 5 — production image
FROM node:22-alpine AS builder
WORKDIR /opt/app
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git python3
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV NODE_ENV=production
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /opt/app
RUN apk add --no-cache vips-dev
ENV NODE_ENV=production
COPY --from=builder --chown=node:node /opt/app ./
RUN mkdir -p public/uploads && chown -R node:node public/uploads
USER node
EXPOSE 1337
CMD ["npm", "run", "start"]
