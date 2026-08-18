FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
# Install ALL dependencies (including devDependencies like Vite) so we can build
RUN npm install
# Copy the entire project (backend and frontend)
COPY . .
# Build the React frontend into the dist/ folder
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
