FROM node:22-slim

RUN npm install -g pnpm@11.2.2

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
