ARG BUILD_FROM
FROM $BUILD_FROM

RUN apk add --no-cache nginx \
    && mkdir -p /run/nginx /var/log/nginx

COPY public/ /var/www/html/
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY run.sh /
RUN chmod +x /run.sh

ENTRYPOINT ["/run.sh"]
