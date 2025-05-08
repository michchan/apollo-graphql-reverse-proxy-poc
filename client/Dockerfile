FROM node:22.14-alpine AS build
WORKDIR /app
COPY package.json .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases
RUN yarn install
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80