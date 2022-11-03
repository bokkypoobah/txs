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
    accounts: {
      "0x12345678" : {
        group: "Group",
        name: "Name",
        type: "eoa",
        mine: true,
        tags: [],
        notes: null,
        contract: {
          symbol: "Contract Symbol",
          name: "Contract Name",
        },
      },
      "0x23456789" : {
        group: "Group",
        name: "Name",
        type: "eoa",
        mine: true,
        tags: [],
        notes: null,
        contract: {
          symbol: "Contract Symbol",
          name: "Contract Name",
        },
      },
    },
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
    addNewAccounts(state, p) {
      logInfo("dataModule", "mutations.addNewAccounts('" + p + "')")
      // state.etherscanAPIKey = p;
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
    addNewAccounts(context, newAccounts) {
      logInfo("dataModule", "actions.addNewAccounts(" + JSON.stringify(newAccounts) + ")");



      // const addAddresses = (action == "connect") ? [this.coinbase] : (this.addressesToAdd == null ? [] : this.addressesToAdd.split(/[, \t\n]+/).filter(name => (name.length == 42 && name.substring(0, 2) == '0x')));
      // for (let address of addAddresses) {
      //   try {
      //     console.log("Processing address: " + address);
      //     const checksummedAddress = ethers.utils.getAddress(address);
      //     if (checksummedAddress && !(checksummedAddress in this.addresses)) {
      //       const info = await getAddressInfo(checksummedAddress, erc721Helper, provider);
      //       console.log("info: " + JSON.stringify(info, null, 2));
      //       Vue.set(this.addresses, checksummedAddress, {
      //         address: checksummedAddress,
      //         type: info && info.type || null,
      //         mine: address == this.coinbase,
      //         ensName: null,
      //         group: null,
      //         name: info && info.symbol && info.name && (info.symbol + ': ' + info.name) || null,
      //         tags: [],
      //         notes: null,
      //         contract: {
      //           name: info && info.name || null,
      //           symbol: info && info.symbol || null,
      //           decimals: info && info.decimals || null,
      //         }
      //       });
      //     }
      //   } catch (e) {
      //     console.log(e.toString());
      //   }




      context.commit('addNewAccounts', p);
      // localStorage.txsEtherscanAPIKey = JSON.stringify(p);
    },
    // Called by Connection.execWeb3()
    async execWeb3({ state, commit, rootState }, { count, listenersInstalled }) {
      logInfo("dataModule", "execWeb3() start[" + count + ", " + listenersInstalled + ", " + JSON.stringify(rootState.route.params) + "]");
    },
  },
};
