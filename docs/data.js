const Data = {
  template: `
  <div>
    <b-button v-b-toggle.data-module size="sm" block variant="outline-info">Data</b-button>
    <b-collapse id="data-module" visible class="my-2">
      <b-card no-body class="border-0">
        <b-row>
          <b-col cols="4" class="small">Accounts</b-col>
          <b-col class="small truncate" cols="8">{{ Object.keys(accounts).length }}</b-col>
        </b-row>
        <b-row>
          <b-col cols="4" class="small">Transactions</b-col>
          <b-col class="small truncate" cols="8">{{ Object.keys(txs).length }}</b-col>
        </b-row>
        <b-row>
          <b-col cols="4" class="small">Assets</b-col>
          <b-col class="small truncate" cols="8">{{ Object.keys(assets).length }}</b-col>
        </b-row>
        <b-row>
          <b-col cols="4" class="small">ENS Map</b-col>
          <b-col class="small truncate" cols="8">{{ Object.keys(ensMap).length }}</b-col>
        </b-row>
      </b-card>
    </b-collapse>
  </div>
  `,
  data: function () {
    return {
      count: 0,
      reschedule: true,
    }
  },
  computed: {
    powerOn() {
      return store.getters['connection/powerOn'];
    },
    explorer () {
      return store.getters['connection/explorer'];
    },
    coinbase() {
      return store.getters['connection/coinbase'];
    },
    network() {
      return store.getters['connection/network'];
    },
    accounts() {
      return store.getters['data/accounts'];
    },
    txs() {
      return store.getters['data/txs'];
    },
    assets() {
      return store.getters['data/assets'];
    },
    ensMap() {
      return store.getters['data/ensMap'];
    },
  },
  methods: {
    async timeoutCallback() {
      logDebug("Data", "timeoutCallback() count: " + this.count);
      this.count++;
      var t = this;
      if (this.reschedule) {
        setTimeout(function() {
          t.timeoutCallback();
        }, 15000);
      }
    },
  },
  beforeDestroy() {
    logDebug("Data", "beforeDestroy()");
  },
  mounted() {
    logDebug("Data", "mounted() $route: " + JSON.stringify(this.$route.params));
    store.dispatch('config/restoreState');
    this.reschedule = true;
    logDebug("Data", "Calling timeoutCallback()");
    this.timeoutCallback();
  },
  destroyed() {
    this.reschedule = false;
  },
};

const dataModule = {
  namespaced: true,
  state: {
    accounts: {}, // TODO: Add chainId
    txs: {},
    assets: {}, // TODO: ChainId/Contract/TokenId/Number
    ensMap: {},
    db: {
      name: "txs090b",
      version: 1,
      schemaDefinition: {
        cache: '&objectName',
        // collection: '&address',
      },
      updated: null,
    },
  },
  getters: {
    accounts: state => state.accounts,
    txs: state => state.txs,
    assets: state => state.assets,
    ensMap: state => state.ensMap,
  },
  mutations: {
    addNewAccount(state, accountInfo) {
      logInfo("dataModule", "mutations.addNewAccount(" + JSON.stringify(accountInfo) + ")")
      const block = store.getters['connection/block'];
      const network = store.getters['connection/network'];
      const chainId = network.chainId;
      const key = chainId + ':' + accountInfo.account;
      Vue.set(state.accounts, key, {
        group: null,
        name: null,
        type: accountInfo && accountInfo.type || null,
        mine: accountInfo.account == store.getters['connection/coinbase'],
        sync: false,
        tags: [],
        notes: null,
        contract: {
          name: accountInfo && accountInfo.name || null,
          symbol: accountInfo && accountInfo.symbol || null,
          decimals: accountInfo && accountInfo.decimals || null,
        },
        collection: accountInfo && accountInfo.collection || {},
        balances: accountInfo && accountInfo.balances || {},
        created: {
          timestamp: block && block.timestamp || null,
          blockNumber: block && block.number || null,
        },
        updated: {
          timestamp: null,
          blockNumber: null,
        },
      });
      logInfo("dataModule", JSON.stringify(key) + " => " + JSON.stringify(state.accounts[key], null, 2));
    },
    addENSName(state, nameInfo) {
      logInfo("dataModule", "mutations.addENSName(" + JSON.stringify(nameInfo) + ")")
      Vue.set(state.ensMap, nameInfo.account, nameInfo.name);
      logInfo("dataModule", "mutations.addENSName - ensMap: " + JSON.stringify(state.ensMap));
    },
    toggleAccountMine(state, key) {
      logInfo("dataModule", "mutations.toggleAccountMine - key: " + JSON.stringify(key));
      // console.log(JSON.stringify(state.accounts[key], null, 2));
      Vue.set(state.accounts[key], 'mine', !state.accounts[key].mine);
      // logInfo("dataModule", "mutations.toggleAccountMine - account: " + JSON.stringify(state.accounts[key], null, 2));
    },
    setAccountType(state, info) {
      logInfo("dataModule", "mutations.setAccountType - info: " + JSON.stringify(info));
      Vue.set(state.accounts[info.key], 'type', info.accountType);
      // logInfo("dataModule", "mutations.setAccountType - account: " + JSON.stringify(state.accounts[info.key], null, 2));
    },
    setGroup(state, info) {
      logInfo("dataModule", "mutations.setGroup - info: " + JSON.stringify(info));
      Vue.set(state.accounts[info.key], 'group', info.group);
      // logInfo("dataModule", "mutations.setAccountType - account: " + JSON.stringify(state.accounts[info.key], null, 2));
    },
  },
  actions: {
    async restoreState(context) {
      const db0 = new Dexie(context.state.db.name);
      db0.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      const accounts = await db0.cache.where("objectName").equals('accounts').toArray();
      if (accounts.length == 1) {
        context.state.accounts = accounts[0].object;
      }
      const txs = await db0.cache.where("objectName").equals('txs').toArray();
      if (txs.length == 1) {
        context.state.txs = txs[0].object;
      }
      const assets = await db0.cache.where("objectName").equals('assets').toArray();
      if (assets.length == 1) {
        context.state.assets = assets[0].object;
      }
      const ensMap = await db0.cache.where("objectName").equals('ensMap').toArray();
      if (ensMap.length == 1) {
        context.state.ensMap = ensMap[0].object;
      }
    },
    async addNewAccounts(context, newAccounts) {
      logInfo("dataModule", "actions.addNewAccounts(" + JSON.stringify(newAccounts) + ")");
      const accounts = newAccounts == null ? [] : newAccounts.split(/[, \t\n]+/).filter(name => (name.length == 42 && name.substring(0, 2) == '0x'));
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const ensReverseRecordsContract = new ethers.Contract(ENSREVERSERECORDSADDRESS, ENSREVERSERECORDSABI, provider);
      for (let account of accounts) {
        const accountInfo = await getAccountInfo(account, provider)
        if (accountInfo.account) {
          context.commit('addNewAccount', accountInfo);
        }
        const names = await ensReverseRecordsContract.getNames([account]);
        const name = names.length == 1 ? names[0] : account;
        if (!(account in context.state.ensMap)) {
          context.commit('addENSName', { account, name });
        }
      }
      const db0 = new Dexie(context.state.db.name);
      db0.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      await db0.cache.put({ objectName: 'accounts', object: context.state.accounts }).then (function() {
      }).catch(function(error) {
        console.log("error: " + error);
      });
      await db0.cache.put({ objectName: 'ensMap', object: context.state.ensMap }).then (function() {
      }).catch(function(error) {
        console.log("error: " + error);
      });
      db0.close();
    },
    async toggleAccountMine(context, key) {
      logInfo("dataModule", "actions.toggleAccountMine - key: " + key);
      context.commit('toggleAccountMine', key);
      const db0 = new Dexie(context.state.db.name);
      db0.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      await db0.cache.put({ objectName: 'accounts', object: context.state.accounts }).then (function() {
      }).catch(function(error) {
        console.log("error: " + error);
      });
      db0.close();
    },
    async setAccountType(context, info) {
      logInfo("dataModule", "actions.setAccountType - info: " + JSON.stringify(info));
      context.commit('setAccountType', info);
      const db0 = new Dexie(context.state.db.name);
      db0.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      await db0.cache.put({ objectName: 'accounts', object: context.state.accounts }).then (function() {
      }).catch(function(error) {
        console.log("error: " + error);
      });
      db0.close();
    },
    async setGroup(context, info) {
      logInfo("dataModule", "actions.setGroup - info: " + JSON.stringify(info));
      context.commit('setGroup', info);
      // const db0 = new Dexie(context.state.db.name);
      // db0.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      // await db0.cache.put({ objectName: 'accounts', object: context.state.accounts }).then (function() {
      // }).catch(function(error) {
      //   console.log("error: " + error);
      // });
      // db0.close();
    },
    // Called by Connection.execWeb3()
    async execWeb3({ state, commit, rootState }, { count, listenersInstalled }) {
      logInfo("dataModule", "execWeb3() start[" + count + ", " + listenersInstalled + ", " + JSON.stringify(rootState.route.params) + "]");
    },
  },
};
