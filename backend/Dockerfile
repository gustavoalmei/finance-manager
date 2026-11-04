FROM node:26.6.0-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# prisma.config.ts exige DATABASE_URL; o generate não conecta no banco
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate

FROM node:26.6.0-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 3000
CMD ["npx", "tsx", "src/server.ts"]
