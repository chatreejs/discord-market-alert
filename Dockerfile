FROM node:18.19.0 AS build
WORKDIR /app

COPY package.json ./
RUN yarn install
COPY . .
RUN yarn build

FROM node:18.19.0-alpine AS production

WORKDIR /app

RUN apk add --no-cache \
    tzdata \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package.json ./
RUN yarn install --production
COPY --from=build /app/dist /app

RUN addgroup -S webusr && adduser -S -G webusr webusr \
    && chown -R webusr:webusr /home/webusr \
    && chown -R webusr:webusr /app

USER webusr

CMD [ "node", "main.js" ]