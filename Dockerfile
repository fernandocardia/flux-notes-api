FROM node:22-alpine as builder

WORKDIR /app

COPY package*.json ./
COPY nest-cli.json tsconfig*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN ls -l dist

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]