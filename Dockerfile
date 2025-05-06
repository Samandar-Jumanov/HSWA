FROM node:20-alpine

WORKDIR /app

# Create the src directory structure to ensure it exists
RUN mkdir -p /app/src

# Install dependencies required for canvas and other native packages
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev \
    libtool \
    autoconf \
    automake \
    pkgconfig \
    pixman-dev

# Create a symbolic link for python
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Command to run the application (development mode for hot-reloading)
CMD ["npm", "run", "dev"]