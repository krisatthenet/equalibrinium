FROM alpine:3.19
ARG PB_VERSION=0.36.7

RUN apk add --no-cache unzip ca-certificates

ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/ && rm /tmp/pb.zip

ARG CACHEBUST=4
COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks

WORKDIR /pb

EXPOSE ${PORT:-8090}

CMD ["/bin/sh", "-c", "./pocketbase serve --http=0.0.0.0:${PORT:-8090} --dir=/pb/pb_data --migrationsDir=/pb/pb_migrations --hooksDir=/pb/pb_hooks --encryptionEnv=PB_ENCRYPTION_KEY --hooksWatch=false"]
