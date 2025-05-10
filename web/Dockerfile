# # ============ Build web app ============ 
FROM node:22.14-alpine AS web-builder

WORKDIR /app

# Install dependencies and build the web app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases/ .yarn/releases/
RUN yarn install --immutable

COPY . .
RUN yarn build

# ============ Build Nginx reverse proxy # ============ 
FROM nginx:1.28.0-alpine AS nginx-builder

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy the built web app from the web-builder stage
COPY --from=web-builder /app/dist /usr/share/nginx/html

# Copy the Nginx configuration template and scripts
COPY nginx/nginx.conf.template /etc/nginx/templates/nginx.conf.template
COPY nginx/scripts.js /etc/nginx/njs/scripts.js

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]

# ============ Build Kong reverse proxy ============ 
FROM kong:3.9.0 AS kong-builder

COPY --from=web-builder /app/dist /usr/share/nginx/html
COPY kong/kong.yml /usr/local/kong/declarative/kong.yml
COPY kong/nginx.conf /etc/kong/nginx.conf

# Switch to root user to modify permissions
USER root

# Copy entrypoint script and set correct permissions
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/usr/local/kong/declarative/kong.yml
ENV KONG_NGINX_HTTP_INCLUDE=/etc/kong/nginx.conf
ENV KONG_PROXY_LISTEN="0.0.0.0:80 reuseport backlog=16384"
# Adjust admin port to avoid conflict
ENV KONG_ADMIN_LISTEN="0.0.0.0:8001 reuseport backlog=16384" 

CMD ["/entrypoint.sh"]