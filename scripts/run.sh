#!/usr/bin/env bash

npx -y browser-sync start \
    --cwd "./docs" \
    --cors true \
    --serveStatic "./docs" \
    --port 3000 \
    --json \
    --server \
    --index "./docs/index.html" \
    --files "./docs/index.html, ./docs/*.js ./docs/*.js.map ./docs/*.min.js ./docs/*.min.js.map ./docs/media/*.gif ./docs/media/*.png ./docs/images/*.png ./docs/images/*.ico ./docs/images/*.svg ./docs/images/*.xml ./docs/images/*.gif ./docs/images/*.json ./docs/css/*.css./docs/css/*.min.css ./docs/css/*.min.css.map" \
    --watch true \
    --logLevel "debug" \
    --no-inject-changes
