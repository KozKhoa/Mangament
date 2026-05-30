FROM node:20

# Create app directory
WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install dependencies (including Prisma)
RUN npm install

# Copy all node source code
COPY . .

# Worker doesnt need to expose any ports.
# Start the worker process directly via Node, allowing environment variables (like NODE_ENV) to be passed in by Docker Compose.
CMD ["sh", "-c", "npx prisma generate && npm run worker"]
