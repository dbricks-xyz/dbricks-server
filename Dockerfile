################################################################################
# build
FROM node:16-alpine3.14 as build-stage
RUN npm i -g cpy-cli
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn
COPY . .
RUN yarn build && yarn postbuild

################################################################################
# deploy
FROM node:16-alpine3.14
RUN apk update && apk add --no-cache bash vim
RUN mkdir /app
COPY --from=build-stage /app/dist /app
COPY --from=build-stage /app/node_modules /node_modules
EXPOSE 3000
CMD ["node", "app/src/server.js"]

