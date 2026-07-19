FROM nginx:1.27-alpine

RUN mkdir -p /var/www/sites
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
