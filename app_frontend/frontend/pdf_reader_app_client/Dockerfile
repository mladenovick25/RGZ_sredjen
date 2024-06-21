# Build stage
FROM node:16 as build-stage
WORKDIR /app


# Define build-time arguments
ARG VUE_APP_BACKEND_PATH
ENV VUE_APP_BACKEND_PATH=${VUE_APP_BACKEND_PATH}

ARG VUE_APP_LOGIN_PATH
ENV VUE_APP_LOGIN_PATH=${VUE_APP_LOGIN_PATH}

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


# Production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
