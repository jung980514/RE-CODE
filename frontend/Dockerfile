# Multi-stage build

# 1단계: 환경 설정 및 dependency 설치
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app

# Dependency install을 위해 package.json, package-lock.json 복사
COPY package.json package-lock.json ./
RUN npm ci

###########################################################

# 2단계: next.js 빌드 단계
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# node_modules 등의 dependency를 복사함.
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_BACKEND_URL
ARG KAKAO_CLIENT_ID
ARG GOOGLE_TTS_API_KEY
ARG NEXT_PUBLIC_KAKAO_REDIRECT_URI
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV KAKAO_CLIENT_ID=${KAKAO_CLIENT_ID}
ENV GOOGLE_TTS_API_KEY=${GOOGLE_TTS_API_KEY}
ENV NEXT_PUBLIC_KAKAO_REDIRECT_URI=${NEXT_PUBLIC_KAKAO_REDIRECT_URI}

# next.js 애플리케이션 빌드
RUN npm run build

###########################################################

# 3단계: next.js 실행 단계
FROM node:18-alpine AS runner
WORKDIR /usr/src/app

# container 환경에 시스템 사용자를 추가함
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}

# next.config.js에서 output을 standalone으로 설정하면
# 빌드에 필요한 최소한의 파일만 ./next/standalone로 출력이 된다.
# standalone 결과물에는 public 폴더와 static 폴더 내용은 포함되지 않으므로, 따로 복사를 해준다.
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/static ./.next/static

# curl 설치 
RUN apk add --no-cache curl

# 컨테이너의 수신 대기 포트를 3030으로 설정
EXPOSE 3030

# node로 애플리케이션 실행
CMD ["node", "server.js"]
