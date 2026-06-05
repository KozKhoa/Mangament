FROM node:20

# Create app directory
WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install dependencies (including Prisma)
RUN npm install

# Copy all node source code
COPY . .

CMD ["sh", "-c", "npx prisma generate && npm run worker"]
