FROM node:24-alpine AS production

WORKDIR /app

RUN apk add --no-cache \
    tzdata \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package.json yarn.lock ./
RUN yarn install --production

# Node 24 runs TypeScript natively (type stripping), so there is no build step.
# The source is executed directly from src/.
COPY . .
RUN yarn gen:version

RUN addgroup -S webusr && adduser -S -G webusr webusr \
    && chown -R webusr:webusr /home/webusr \
    && chown -R webusr:webusr /app

USER webusr

CMD [ "node", "src/main.ts" ]
