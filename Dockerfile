FROM node:22-alpine
ENV CI=true

WORKDIR /usr/src/app

RUN apk add --no-cache dumb-init

# Load dependencies first so we can cache them
COPY --chown=node:node ./package.json .
COPY --chown=node:node ./package-lock.json .
COPY --chown=node:node ./tsconfig.json .
RUN npm ci

COPY --chown=node:node src ./src
COPY --chown=node:node data ./data

WORKDIR /usr/src/app
EXPOSE 3000
ENV NODE_ENV=production
ENV TZ=UTC
USER node
ENTRYPOINT ["dumb-init", "node", "--experimental-strip-types", "./src/server.ts"]
