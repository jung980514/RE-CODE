# Multi-stage build

# 1단계: 환경 설정 및 dependency 설치
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat

# 명령어를 실행할 디렉터리 지정
WORKDIR /usr/src/app

# Dependency install을 위해 package.json, package-lock.json 복사 
COPY package.json package-lock.json ./ 

# Dependency 설치
RUN npm ci --only=production

###########################################################

# 2단계: next.js 빌드 단계
FROM node:18-alpine AS builder

# Docker를 build할때 개발 모드 구분용 환경 변수를 명시함
ARG ENV_MODE=production

# 명령어를 실행할 디렉터리 지정
WORKDIR /usr/src/app

# node_modules 등의 dependency를 복사함.
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

# 환경 변수 설정 (환경별 .env 파일 대신 환경 변수 사용)
ENV NODE_ENV=${ENV_MODE}
ENV NEXT_PUBLIC_ENV=${ENV_MODE}

# 환경별 환경 변수 설정
RUN if [ "$ENV_MODE" = "dev" ]; then \
        echo "NODE_ENV=development" > .env.production && \
        echo "NEXT_PUBLIC_API_URL=http://localhost:8088" >> .env.production && \
        echo "NEXT_PUBLIC_ENV=dev" >> .env.production; \
    elif [ "$ENV_MODE" = "staging" ]; then \
        echo "NODE_ENV=staging" > .env.production && \
        echo "NEXT_PUBLIC_API_URL=https://staging.recode-my-life.site" >> .env.production && \
        echo "NEXT_PUBLIC_ENV=staging" >> .env.production; \
    else \
        echo "NODE_ENV=production" > .env.production && \
        echo "NEXT_PUBLIC_API_URL=https://recode-my-life.site" >> .env.production && \
        echo "NEXT_PUBLIC_ENV=prod" >> .env.production; \
    fi

RUN npm run build

###########################################################

# 3단계: next.js 실행 단계
FROM node:18-alpine AS runner

# 명령어를 실행할 디렉터리 지정
WORKDIR /usr/src/app
 
# container 환경에 시스템 사용자를 추가함
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# next.config.js에서 output을 standalone으로 설정하면 
# 빌드에 필요한 최소한의 파일만 ./next/standalone로 출력이 된다.
# standalone 결과물에는 public 폴더와 static 폴더 내용은 포함되지 않으므로, 따로 복사를 해준다.
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/static ./.next/static

# 컨테이너의 수신 대기 포트를 3030으로 설정
EXPOSE 3030

# node로 애플리케이션 실행
CMD ["node", "server.js"] 

# standalone으로 나온 결과값은 node 자체적으로만 실행 가능
# CMD ["npm", "start"]