# ══ STAGE 1 : BUILD Angular ══════════════
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build -- --configuration production

# ══ STAGE 2 : PRODUCTION Nginx ═══════════
FROM nginx:alpine
COPY --from=builder /app/dist/frontend \
     /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]