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
    // setEtherscanAPIKey(p) {
    //   console.log("setEtherscanAPIKey(): " + p);
    //   store.dispatch('config/setEtherscanAPIKey', p);
    // },
    // setPeriodStart(p) {
    //   console.log("setPeriodStart(): " + p);
    //   store.dispatch('config/setPeriodStart', p);
    // },
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
    accounts: {},
    txs: {},
    assets: {}, // ChainId/Contract/TokenId/Number
    ensMap: {},
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
      Vue.set(state.accounts, accountInfo.account, {
        group: null,
        name: null,
        type: accountInfo && accountInfo.type || null,
        mine: accountInfo.account == store.getters['connection/coinbase'],
        tags: [],
        notes: null,
        contract: {
          name: accountInfo && accountInfo.name || null,
          symbol: accountInfo && accountInfo.symbol || null,
          decimals: accountInfo && accountInfo.decimals || null,
        },
        updated: {
          timestamp: block && block.timestamp || null, // TODO: Set to null and use for incremental syncs
          blockNumber: block && block.number || null, // TODO: Set to null and use for incremental syncs
        },
      });
      logInfo("dataModule", "accounts: " + JSON.stringify(state.accounts, null, 2));
    },
  },
  actions: {
    restoreState(context) {
      // logInfo("dataModule", "actions.restoreState()");
      // if ('txsEtherscanAPIKey' in localStorage) {
      //   context.commit('setEtherscanAPIKey', JSON.parse(localStorage.txsEtherscanAPIKey));
      // }
      // if ('txsPeriodStart' in localStorage) {
      //   context.commit('setPeriodStart', JSON.parse(localStorage.txsPeriodStart));
      // }
      logInfo("dataModule", "actions.restoreState() - state: " + JSON.stringify(context.state));
    },
    async addNewAccounts(context, newAccounts) {
      logInfo("dataModule", "actions.addNewAccounts(" + JSON.stringify(newAccounts) + ")");
      const accounts = newAccounts == null ? [] : newAccounts.split(/[, \t\n]+/).filter(name => (name.length == 42 && name.substring(0, 2) == '0x'));
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      for (let account of accounts) {
        const accountInfo = await getAccountInfo(account, provider)
        console.log("accountInfo: " + JSON.stringify(accountInfo));
        if (accountInfo.account) {
          context.commit('addNewAccount', accountInfo);
        }
      }

      // context.commit('addNewAccounts', accounts);
      // localStorage.txsEtherscanAPIKey = JSON.stringify(p);
    },
    // Called by Connection.execWeb3()
    async execWeb3({ state, commit, rootState }, { count, listenersInstalled }) {
      logInfo("dataModule", "execWeb3() start[" + count + ", " + listenersInstalled + ", " + JSON.stringify(rootState.route.params) + "]");
    },
  },
};
