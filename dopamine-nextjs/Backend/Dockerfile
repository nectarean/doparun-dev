FROM node:24-alpine as base
WORKDIR /app

FROM base as dev
COPY package*.json ./
RUN npm ci 
COPY . .
EXPOSE 3000
CMD [ "npm", "run", "dev" ]

FROM base as builder
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM base as prod
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next/ ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD [ "npm" , "start"]