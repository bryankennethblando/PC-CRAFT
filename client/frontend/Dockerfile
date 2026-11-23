FROM node:24-bookworm-slim AS build

WORKDIR /app/client/frontend
COPY client/frontend/package.json client/frontend/package-lock.json ./
RUN npm ci

COPY client/frontend/ ./
COPY client/assets/ ../assets/
RUN npm run build

FROM nginx:stable-alpine

COPY client/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/frontend/dist/ /usr/share/nginx/html/
