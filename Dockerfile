FROM node:latest

RUN mkdir -p /home/backend
WORKDIR /home/backend

COPY package*.json /home/backend/

RUN yarn install

COPY . /home/backend/

EXPOSE 3000

CMD ["yarn", "start"]