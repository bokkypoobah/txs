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
    sync: {
      section: null,
      total: null,
      completed: null,
      halt: false,
    },
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
    sync: state => state.sync,
  },
  mutations: {
    addNewAccount(state, accountInfo) {
      // logInfo("dataModule", "mutations.addNewAccount(" + JSON.stringify(accountInfo) + ")");
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
    },
    addENSName(state, nameInfo) {
      Vue.set(state.ensMap, nameInfo.account, nameInfo.name);
    },
    toggleAccountMine(state, key) {
      Vue.set(state.accounts[key], 'mine', !state.accounts[key].mine);
    },
    toggleAccountSync(state, key) {
      Vue.set(state.accounts[key], 'sync', !state.accounts[key].sync);
    },
    setAccountType(state, info) {
      Vue.set(state.accounts[info.key], 'type', info.accountType);
    },
    setGroup(state, info) {
      Vue.set(state.accounts[info.key], 'group', info.group);
    },
    setName(state, info) {
      Vue.set(state.accounts[info.key], 'name', info.name);
    },
    setNotes(state, info) {
      Vue.set(state.accounts[info.key], 'notes', info.notes);
    },
    importEtherscanResults(state, info) {
      logInfo("dataModule", "mutations.importEtherscanResults - info: " + JSON.stringify(info).substring(0, 1000));
      const [account, results] = [info.account, info.results];
      const block = store.getters['connection/block'];
      for (const result of results) {
        if (!(result.hash in state.txs)) {
          Vue.set(state.txs, result.hash, {
            blockNumber: result.blockNumber,
            timestamp: result.timeStamp,
            nonce: result.nonce,
            blockHash: result.blockHash,
            transactionIndex: result.transactionIndex,
            from: ethers.utils.getAddress(result.from),
            to: (result.to == null && result.to.length == 0) ? null : ethers.utils.getAddress(result.to),
            value: result.value,
            gas: result.gas,
            gasPrice: result.gasPrice,
            isError: result.isError,
            txReceiptStatus: result.txreceipt_status,
            input: result.input,
            contractAddress: (result.contractAddress == null || result.contractAddress.length == 0) ? null : ethers.utils.getAddress(result.contractAddress),
            cumulativeGasUsed: result.cumulativeGasUsed,
            gasUsed: result.gasUsed,
            confirmations: result.confirmations,
            methodId: result.methodId,
            functionName: result.functionName,
            etherscanImported: {
              account,
              timestamp: block && block.timestamp || null,
              blockNumber: block && block.number || null,
            },
            dataImported: {
              tx: null,
              txReceipt: null,
              balances: {},
              balancePreviousBlock: {},
              timestamp: null,
              blockNumber: null,
            },
            computed: {
              info: {},
              timestamp: null,
              blockNumber: null,
            },
          });
        }
      }
    },
    setSyncSection(state, info) {
      state.sync.section = info.section;
      state.sync.total = info.total;
    },
    setSyncCompleted(state, completed) {
      state.sync.completed = completed;
    },
    setSyncHalt(state, halt) {
      state.sync.halt = halt;
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
        console.log(JSON.stringify(context.state.txs, null, 2).substring(0, 2000));
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
      // logInfo("dataModule", "actions.addNewAccounts(" + JSON.stringify(newAccounts) + ")");
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
      context.dispatch('saveData', ['accounts', 'ensMap']);
    },
    async saveData(context, types) {
      // logInfo("dataModule", "actions.saveData - types: " + JSON.stringify(types));
      const db0 = new Dexie(context.state.db.name);
      db0.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      for (let type of types) {
        await db0.cache.put({ objectName: type, object: context.state[type] }).then (function() {
        }).catch(function(error) {
          console.log("error: " + error);
        });
      }
      db0.close();
    },
    async toggleAccountMine(context, key) {
      context.commit('toggleAccountMine', key);
      context.dispatch('saveData', ['accounts']);
    },
    async toggleAccountSync(context, key) {
      context.commit('toggleAccountSync', key);
      context.dispatch('saveData', ['accounts']);
    },
    async setAccountType(context, info) {
      context.commit('setAccountType', info);
      context.dispatch('saveData', ['accounts']);
    },
    async setGroup(context, info) {
      context.commit('setGroup', info);
      context.dispatch('saveData', ['accounts']);
    },
    async setName(context, info) {
      context.commit('setName', info);
      context.dispatch('saveData', ['accounts']);
    },
    async setNotes(context, info) {
      context.commit('setNotes', info);
      context.dispatch('saveData', ['accounts']);
    },
    async syncIt(context, sections) {
      logInfo("dataModule", "actions.syncIt - sections: " + JSON.stringify(sections));
      const etherscanAPIKey = store.getters['config/etherscanAPIKey'] && store.getters['config/etherscanAPIKey'].length > 0 && store.getters['config/etherscanAPIKey'] || "YourApiKeyToken";
      const block = store.getters['connection/block'];
      const blockNumber = block && block.number || 'error!!!';

      context.commit('setSyncHalt', false);
      for (let section of sections) {
        if (section == 'importFromEtherscan') {
          const keysToSync = [];
          for (const [key, item] of Object.entries(context.state.accounts)) {
            if (item.sync) {
              keysToSync.push(key);
            }
          }
          context.commit('setSyncSection', { section: 'Import', total: keysToSync.length });
          let pause = false;
          for (const keyIndex in keysToSync) {
            const key = keysToSync[keyIndex];
            const item = context.state.accounts[key];
            const [chainId, account] = key.split(':');
            console.log("--- Syncing " + account + " --- ");
            if (pause) {
              // context.commit('setSyncSection', { section: 'Pausing', total: keysToSync.length });
              sleep(5000);
              // context.commit('setSyncSection', { section: 'Import', total: keysToSync.length });
            }
            context.commit('setSyncCompleted', parseInt(keyIndex) + 1);
            let importUrl = "https://api.etherscan.io/api?module=account&action=txlist&address=" + account + "&startblock=0&endblock=" + blockNumber + "&page=1&offset=10000&sort=asc&apikey=" + etherscanAPIKey;
            console.log("importUrl: " + importUrl);
            const importData = await fetch(importUrl)
              .then(handleErrors)
              .then(response => response.json())
              .catch(function(error) {
                 console.log("ERROR - processIt: " + error);
                 // Want to work around API data unavailablity - state.sync.error = true;
                 return [];
              });
            console.log(JSON.stringify(importData, null, 2).substring(0, 10000));
            if (importData.status == 1) {
              context.commit('importEtherscanResults', { account, results: importData.result });
            }
            // Retrieve
            if (importData.message && importData.message.includes("Missing")) {
              pause = true;
            }
            if (context.state.sync.halt) {
              // console.log("Halting");
              break;
            }
          }
          context.dispatch('saveData', ['txs']);
          context.commit('setSyncSection', { section: null, total: null });
        }
      }
    },
    async setSyncHalt(context, halt) {
      context.commit('setSyncHalt', halt);
    },
    // Called by Connection.execWeb3()
    async execWeb3({ state, commit, rootState }, { count, listenersInstalled }) {
      logInfo("dataModule", "execWeb3() start[" + count + ", " + listenersInstalled + ", " + JSON.stringify(rootState.route.params) + "]");
    },
  },
};
