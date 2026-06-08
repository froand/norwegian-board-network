FROM norsknettverkacr.azurecr.io/node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM norsknettverkacr.azurecr.io/node:20-alpine
RUN npm install -g serve
COPY --from=build /app/dist /app
EXPOSE 80
CMD ["serve", "-s", "/app", "-l", "80"]
