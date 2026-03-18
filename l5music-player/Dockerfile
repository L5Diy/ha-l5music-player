ARG BUILD_FROM
FROM $BUILD_FROM

RUN apk add --no-cache nginx

COPY public/ /var/www/html/
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
