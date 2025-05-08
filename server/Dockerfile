FROM node:22.14-alpine
WORKDIR /app
COPY package.json .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases
RUN yarn install
COPY . .
RUN yarn build
CMD ["yarn", "start"]