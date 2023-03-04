#!/usr/bin/env bash

# Update dependencies and source maps

# JS
wget -NP ./docs/js https://cdnjs.cloudflare.com/ajax/libs/bignumber.js/4.0.0/bignumber.js.map
wget -NP ./docs/js https://cdnjs.cloudflare.com/ajax/libs/bootstrap-vue/2.15.0/bootstrap-vue.js.map
wget -NP ./docs/js https://cdnjs.cloudflare.com/ajax/libs/bootstrap-vue/2.15.0/bootstrap-vue.min.js.map
wget -NP ./docs/js https://cdnjs.cloudflare.com/ajax/libs/bootstrap-vue/2.15.0/bootstrap-vue-icons.min.js.map
wget -NP ./docs/js https://cdnjs.cloudflare.com/ajax/libs/dexie/3.0.3/dexie.js.map

# CSS
wget -NP ./docs/css https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css.map
wget -NP ./docs/css https://cdnjs.cloudflare.com/ajax/libs/bootstrap-vue/2.15.0/bootstrap-vue.min.css.map
wget -NP ./docs/css https://cdnjs.cloudflare.com/ajax/libs/bootstrap-vue/2.15.0/bootstrap-vue-icons.min.css.map
