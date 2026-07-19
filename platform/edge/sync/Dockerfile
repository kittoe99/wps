FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY sync-worker.js ./
ENV SITE_ROOT=/var/www/sites
CMD ["node", "sync-worker.js"]
