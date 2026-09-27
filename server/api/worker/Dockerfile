FROM node:20
RUN apt-get update && apt-get install -y --no-install-recommends p7zip-full unzip && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install dependencies (including Prisma)
RUN npm install

# Copy all node source code
COPY . .

CMD ["sh", "-c", "npx prisma generate && npm run worker"]
