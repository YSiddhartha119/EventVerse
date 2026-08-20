FROM node:22-alpine
WORKDIR /app

# Copy package files and install ALL dependencies (including Vite for building)
COPY package*.json ./
RUN npm install

# Copy everything and build the React frontend
COPY . .
RUN npm run build

# Expose the port and start the server
EXPOSE 4000
CMD ["npm", "start"]
