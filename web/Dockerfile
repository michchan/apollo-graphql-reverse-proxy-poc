# Build web app
FROM node:22.14-alpine AS web-builder

WORKDIR /app

# Install dependencies and build the web app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases/ .yarn/releases/
RUN yarn install --immutable

COPY . .
RUN yarn build

# Build Nginx reverse proxy
FROM nginx:1.28.0-alpine AS nginx-builder

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy the built web app from the web-builder stage
COPY --from=web-builder /app/dist /usr/share/nginx/html

# Copy the Nginx configuration template and scripts
COPY nginx/nginx.conf.template /etc/nginx/templates/nginx.conf.template
COPY nginx/scripts.js /etc/nginx/njs/scripts.js

# Command to substitute environment variables and start Nginx
CMD sh -c "envsubst '\$ALLOWED_ORIGIN \$ALLOWED_HEADERS \$SERVER_NAME' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf && nginx -v && nginx -g 'daemon off;'"

# Build Kong reverse proxy
FROM kong:3.0.0 AS kong-builder

COPY --from=web-builder /app/dist /usr/share/nginx/html
COPY kong/kong.yml /usr/local/kong/declarative/kong.yml

CMD ["kong", "docker-start"]