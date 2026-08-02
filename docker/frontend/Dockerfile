# =============================================================================
# chroniq.cc Frontend — Production Dockerfile (build + nginx)
# =============================================================================
FROM node:22-alpine AS build

WORKDIR /app
COPY frontend/package.json frontend/yarn.lock* ./
RUN yarn install --frozen-lockfile
COPY frontend/ ./

# Keycloak/API build-time config (baked into the bundle).
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID
RUN yarn build

FROM nginx:alpine
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
