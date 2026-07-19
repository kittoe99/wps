FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc && mkdir -p dist/db && cp src/db/schema.sql dist/db/ || true

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY src/db/schema.sql ./src/db/schema.sql
COPY scripts ./scripts
EXPOSE 8080
CMD ["node", "dist/index.js"]
