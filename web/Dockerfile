# Build web app
FROM node:22.14-alpine AS web-builder

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases/ .yarn/releases/
RUN yarn install --immutable

COPY . .
RUN yarn build

# Build Nginx reverse proxy
FROM nginx:1.28.0-alpine AS nginx-builder

COPY --from=web-builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/scripts.js /etc/nginx/njs/scripts.js

CMD ["sh", "-c", "nginx -v; nginx -g 'daemon off;'"]

# Build Kong reverse proxy
FROM kong:3.0.0 AS kong-builder

COPY --from=web-builder /app/dist /usr/share/nginx/html
COPY kong/kong.yml /usr/local/kong/declarative/kong.yml

CMD ["kong", "docker-start"]