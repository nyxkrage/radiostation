FROM node:10
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY index.js index.js
COPY static static
EXPOSE 8801

CMD [ "node", "index.js" ]

