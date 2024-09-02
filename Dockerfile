FROM node:21-alpine

# Set the working directory inside the container
WORKDIR /app

# Install Chromium manually for puppeteer (if needed)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set the path for Puppeteer to find Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Set environment variable to skip puppeteer download if you prefer not to use it
# ENV PUPPETEER_SKIP_DOWNLOAD true

# Clear npm cache and install dependencies
RUN npm install

# Copy the rest of your application code into the container
COPY . .

# Command to start your application
CMD ["node", "index.js"]
