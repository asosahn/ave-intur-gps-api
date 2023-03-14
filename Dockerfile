FROM node:18.12.1-alpine3.15
WORKDIR /usr/src/ave
COPY . /usr/src/ave
# RUN npm install -G typescript@3.4.5
RUN npm install
RUN npm run build
CMD ["node", "dist/main"]
