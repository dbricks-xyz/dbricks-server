FROM node:16-alpine3.14
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn
COPY . .
RUN yarn build
EXPOSE 3000
CMD ["node", "dist/src/server.js"]