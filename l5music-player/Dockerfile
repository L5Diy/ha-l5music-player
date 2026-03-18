ARG BUILD_FROM
FROM $BUILD_FROM

RUN apk add --no-cache nginx \
    && mkdir -p /run/nginx /var/log/nginx

COPY public/ /var/www/html/
COPY nginx.conf /etc/nginx/http.d/default.conf

# s6-overlay service
RUN mkdir -p /etc/services.d/nginx
COPY run.sh /etc/services.d/nginx/run
RUN chmod +x /etc/services.d/nginx/run
