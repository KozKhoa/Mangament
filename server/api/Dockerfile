FROM node:20
RUN apt-get update && apt-get install -y --no-install-recommends p7zip-full unzip && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run seed:prod && npm run start"]
