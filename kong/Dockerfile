FROM kong:3.4
USER root
COPY kong.yml /usr/local/kong/declarative/kong.yml
COPY plugins/refresh-token-plugin /usr/local/kong/plugins/refresh-token-plugin
USER kong
ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/usr/local/kong/declarative/kong.yml
ENV KONG_PROXY_ACCESS_LOG=/dev/stdout
ENV KONG_ADMIN_ACCESS_LOG=/dev/stdout
ENV KONG_PROXY_ERROR_LOG=/dev/stderr
ENV KONG_ADMIN_ERROR_LOG=/dev/stderr
ENV KONG_PLUGINS=bundled,refresh-token-plugin