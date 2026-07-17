FROM node:22-alpine AS builder
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY frontend/package.json frontend/
RUN npm ci --workspaces --include-workspace-root
COPY shared/ shared/
COPY frontend/ frontend/
RUN cd frontend && npm run build

FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
