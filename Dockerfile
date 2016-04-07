FROM node:argon

ENV HOME /root
ENV NODE_ENV production
ENV REDIS redis

ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN npm install --silent -g forever
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

ADD . /opt/app
WORKDIR /opt/app

CMD forever ./index.js
