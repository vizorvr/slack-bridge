FROM node:argon

ENV HOME /root
ENV NODE_ENV production
ENV REDIS redis

ADD . /usr/src/app

WORKDIR /usr/src/app

RUN npm install --silent -g forever
RUN npm install --silent --unsafe-perm

CMD forever ./index.js
