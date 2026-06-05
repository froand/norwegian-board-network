#!/bin/sh
# Substitute environment variable in nginx config
envsubst '${API_BACKEND_URL}' < /etc/nginx/conf.d/default.conf > /tmp/default.conf
mv /tmp/default.conf /etc/nginx/conf.d/default.conf
