FROM node:8-alpine
MAINTAINER Michael Barany <michael.barany@gmail.com>

# Install app dependencies
COPY package.json /tmp/package.json
COPY package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install --prod
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

WORKDIR /opt/app

COPY . /opt/app

VOLUME /opt/app/config

ENV NODE_ENV=production

EXPOSE 8080

CMD [ "npm", "start" ]
