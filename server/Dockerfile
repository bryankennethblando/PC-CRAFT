FROM node:24-bookworm-slim

WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

COPY server/ ./
COPY database/seeds/module.md database/seeds/curriculum-quizzes.json /app/database/seeds/

ENV NODE_ENV=production
USER node
EXPOSE 5000
CMD ["node", "server.js"]
