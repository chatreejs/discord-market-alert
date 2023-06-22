FROM node:16.19.0 AS build
WORKDIR /app

COPY package.json ./
RUN yarn install && yarn global add typescript
COPY . .
RUN yarn build

FROM node:16.19.0-alpine AS production

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
COPY --from=build /app/config /app/config

RUN addgroup -S pptruser && adduser -S -G pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

USER pptruser

CMD [ "node", "main.js" ]