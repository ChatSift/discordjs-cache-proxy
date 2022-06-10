FROM node:16-alpine

WORKDIR /usr/proxy

# First copy over dependencies separate from src for better caching
COPY package.json yarn.lock tsconfig.json .yarnrc.yml ./
COPY .yarn ./.yarn

RUN yarn workspaces focus

# Next up, copy over our src and build it, then prune deps for prod
COPY ./src ./src
RUN yarn build && yarn workspaces focus --production

CMD ["node", "--enable-source-maps", "./dist/index.js"]
