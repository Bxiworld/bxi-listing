# Stage 1: Build static assets
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Accept build-time env for CRA (needs REACT_APP_* at build time)
ARG REACT_APP_LANDING_URL
ENV REACT_APP_LANDING_URL=$REACT_APP_LANDING_URL

RUN npm run build

# Stage 2: Serve via nginx
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
