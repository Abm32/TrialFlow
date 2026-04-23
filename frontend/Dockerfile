FROM node:20-bookworm-slim

ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api
ARG NEXT_PUBLIC_INITIA_CHAIN_ID=initiation-2
ARG NEXT_PUBLIC_INITIA_NETWORK=testnet

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_INITIA_CHAIN_ID=${NEXT_PUBLIC_INITIA_CHAIN_ID} \
    NEXT_PUBLIC_INITIA_NETWORK=${NEXT_PUBLIC_INITIA_NETWORK}

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend ./

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
