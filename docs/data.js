const Data = {
  template: `
  <div>
    <b-button v-b-toggle.data-module size="sm" block variant="outline-info">Data</b-button>
    <b-collapse id="data-module" visible class="my-2">
      <b-card no-body class="border-0">
        <!--
        <b-row>
          <b-col cols="4" class="small">Nix</b-col>
          <b-col class="small truncate" cols="8">
            <b-link :href="network.explorer + 'address/' + network.nixAddress + '#code'" class="card-link" target="_blank">{{ network.nixAddress == null ? '' : (network.nixAddress.substring(0, 20) + '...') }}</b-link>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" class="small">Nix Helper</b-col>
          <b-col class="small truncate" cols="8">
            <b-link :href="network.explorer + 'address/' + network.nixHelperAddress + '#code'" class="card-link" target="_blank">{{ network.nixHelperAddress == null ? '' : (network.nixHelperAddress.substring(0, 20) + '...') }}</b-link>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" class="small">Royalty Engine</b-col>
          <b-col class="small truncate" cols="8">
            <b-link :href="network.explorer + 'address/' + network.royaltyEngineAddress + '#code'" class="card-link" target="_blank">{{ network.royaltyEngineAddress == null ? '' : (network.royaltyEngineAddress.substring(0, 20) + '...') }}</b-link>
          </b-col>
        </b-row>
        -->
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
    setEtherscanAPIKey(p) {
      console.log("setEtherscanAPIKey(): " + p);
      store.dispatch('config/setEtherscanAPIKey', p);
    },
    setPeriodStart(p) {
      console.log("setPeriodStart(): " + p);
      store.dispatch('config/setPeriodStart', p);
    },
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
    setEtherscanAPIKey(state, p) {
      // logInfo("dataModule", "mutations.setEtherscanAPIKey('" + p + "')")
      state.etherscanAPIKey = p;
    },
    setPeriodStart(state, p) {
      // logInfo("dataModule", "mutations.setPeriodStart('" + p + "')")
      state.periodStart = p;
    },
  },
  actions: {
    restoreState(context) {
      // logInfo("dataModule", "actions.restoreState()");
      if ('txsEtherscanAPIKey' in localStorage) {
        context.commit('setEtherscanAPIKey', JSON.parse(localStorage.txsEtherscanAPIKey));
      }
      if ('txsPeriodStart' in localStorage) {
        context.commit('setPeriodStart', JSON.parse(localStorage.txsPeriodStart));
      }
      logInfo("dataModule", "actions.restoreState() - state: " + JSON.stringify(context.state));
    },
    setEtherscanAPIKey(context, p) {
      // logInfo("dataModule", "actions.setEtherscanAPIKey(" + JSON.stringify(p) + ")");
      context.commit('setEtherscanAPIKey', p);
      localStorage.txsEtherscanAPIKey = JSON.stringify(p);
    },
    setPeriodStart(context, p) {
      // logInfo("dataModule", "actions.setPeriodStart(" + JSON.stringify(p) + ")");
      context.commit('setPeriodStart', p);
      localStorage.txsPeriodStart = JSON.stringify(p);
    },
  },
};
