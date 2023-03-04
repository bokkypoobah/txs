# Txs

[https://bokkypoobah.github.io/txs/](https://bokkypoobah.github.io/txs/)

## Debugging in Development Environment

* Fork and clone the repository
* Install Node.js 19.6.0
    * Optionally via installing [NVM](https://github.com/nvm-sh/nvm) and running `nvm use`
* Install NPX
```bash
sudo npm install -g npx
```
* Run [Vue.js Devtools](https://devtools.vuejs.org/guide/installation.html#using-global-package)
```bash
npx -y @vue/devtools
```
* Uncomment `<script src="http://localhost:8098"></script>` in index.html
* Click "Yes" when popup appears _Do you want the application “Electron.app” to accept incoming network connections?_
* Run the server and static website in **separate terminal tab**
```bash
./scripts/run.sh
```
* Check browser console for any errors or warnings
* Update dependencies used in ./docs/index.html if necessary including source maps from a CDN for browser debugging using breakpoints. 
