FROM node:18.12.1-alpine3.15
RUN apk add --no-cache tzdata
RUN cp /usr/share/zoneinfo/America/Tegucigalpa /etc/localtime
ENV TZ=America/Tegucigalpa
WORKDIR /usr/src/ave
COPY . /usr/src/ave
# RUN npm install -G typescript@3.4.5
RUN npm install
RUN npm run build
CMD ["node", "dist/main"]
