# Stage 1: Base - Install dependencies
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 2: Test - Run automated tests
FROM base AS test
COPY . .
RUN npm run test

# Stage 3: Build - Build the production application
FROM base AS build
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY
COPY . .
RUN npm run build

# Stage 4: Production - Serve with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
