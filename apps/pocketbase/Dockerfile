FROM alpine:3.19
ARG PB_VERSION=0.36.7

RUN apk add --no-cache unzip ca-certificates

# Vendored PocketBase binary (linux_amd64), copied from the repo instead of
# downloaded at build time. Fetching from GitHub releases during the build
# (ADD/curl) repeatedly failed the Railway image build on network/CDN issues;
# copying a committed artifact makes the build fully self-contained.
COPY pocketbase_0.36.7_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/ && rm /tmp/pb.zip

ARG CACHEBUST=33
RUN echo "Cache bust: $CACHEBUST"
COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks

WORKDIR /pb

EXPOSE ${PORT:-8090}

CMD ["/bin/sh", "-c", "if [ -n \"$PB_ADMIN_EMAIL\" ] && [ -n \"$PB_ADMIN_PASSWORD\" ]; then ./pocketbase superuser upsert \"$PB_ADMIN_EMAIL\" \"$PB_ADMIN_PASSWORD\" --dir=/pb/pb_data --encryptionEnv=PB_ENCRYPTION_KEY 2>/dev/null || true; fi && ./pocketbase serve --http=0.0.0.0:${PORT:-8090} --dir=/pb/pb_data --migrationsDir=/pb/pb_migrations --hooksDir=/pb/pb_hooks --encryptionEnv=PB_ENCRYPTION_KEY --hooksWatch=false"]
