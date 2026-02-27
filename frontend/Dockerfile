FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

EXPOSE 3000
ENV NODE_ENV=production

RUN npm run build

CMD ["npm", "run", "start", "--", "-p", "3000"]
