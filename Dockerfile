FROM node:7.2.0
COPY . /usr/src/app
RUN cd /usr/src/app && npm install
RUN cd /usr/src/app && ./node_modules/.bin/gulp
ENV NODE_ENV production
WORKDIR /usr/src/app
CMD ["node", "dist/index.js"]
EXPOSE 80
