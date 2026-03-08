FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY src ./src
COPY setup-db.js ./

EXPOSE 5000

CMD ["sh", "-c", "node setup-db.js && node src/index.js"]
