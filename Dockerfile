################################################################################
# build
FROM node:16-alpine3.14 as build-stage
RUN npm i -g cpy-cli
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn
COPY . .
RUN echo MAINNET_NODE_URL='https://rough-thrumming-haze.solana-mainnet.quiknode.pro/9e0eb0a4e3f28f489f1e15e22559bb89bfb8d319/' >> .env
RUN yarn build && yarn postbuild

################################################################################
# deploy
FROM node:16-alpine3.14
RUN apk update && apk add --no-cache bash vim
RUN mkdir /app
COPY --from=build-stage /app/dist /app
COPY --from=build-stage /app/node_modules /node_modules
EXPOSE 3000
CMD ["node", "app/server.js"]

