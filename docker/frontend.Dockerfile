FROM node:20-alpine AS build

WORKDIR /app

ARG REACT_APP_API_URL=/api
ARG REACT_APP_MICROSOFT_OAUTH=true
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_MICROSOFT_OAUTH=$REACT_APP_MICROSOFT_OAUTH
ENV PUBLIC_URL=.

COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
