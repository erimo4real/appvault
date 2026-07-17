FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
RUN npm ci --workspaces --include-workspace-root
COPY shared/ shared/
COPY backend/ backend/
RUN cd backend && npx prisma generate && npx tsc -p tsconfig.json
EXPOSE 4000
CMD ["node", "backend/dist/server.js"]
