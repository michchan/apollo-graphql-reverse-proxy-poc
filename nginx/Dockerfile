FROM nginx:alpine
RUN apk add --no-cache nginx-mod-http-js
COPY nginx.conf /etc/nginx/nginx.conf
COPY scripts.js /etc/nginx/scripts.js
COPY ./client/dist /usr/share/nginx/html