FROM node:24-alpine AS base
WORKDIR /usr/src/app
STOPSIGNAL SIGTERM

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .
EXPOSE 5000
USER node
CMD ["npm", "run", "dev"]

FROM base AS prod
ENV NODE_ENV=production
COPY --from=prod-deps --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .
EXPOSE 5000
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/health/ready || exit 1
CMD ["node", "src/index.js"]

