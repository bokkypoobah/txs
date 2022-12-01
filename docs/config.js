const Config = {
  template: `
    <div class="m-0 p-0">
      <b-card no-body no-header class="border-0">
        <b-card no-body no-header bg-variant="light" class="m-1 p-1 w-75">
          <b-card-body class="m-1 p-1">
            <b-form-group label-cols-lg="2" label="Import Settings" label-size="md" label-class="font-weight-bold pt-0" class="mt-3 mb-0">
              <b-form-group label="Etherscan API Key:" label-for="etherscan-apikey" label-size="sm" label-cols-sm="2" label-align-sm="right" description="This key is stored in your local browser storage and is sent with Etherscan API requests. If not supplied, imports from Etherscan will be rate limited to 1 request every 5 seconds" class="mx-0 my-1 p-0">
                <b-form-input type="text" size="sm" id="etherscan-apikey" :value="settings.etherscanAPIKey" @change="setEtherscanAPIKey($event)" placeholder="See https://docs.etherscan.io/ to obtain an API key" class="w-75"></b-form-input>
              </b-form-group>
              <b-form-group label="Batch Size:" label-for="import-batchsize" label-size="sm" label-cols-sm="2" label-align-sm="right" :description="'Batch size for Etherscan transactions and internal transactions API calls, and web3 event filter calls'" class="mx-0 my-1 p-0">
                <b-form-select size="sm" id="import-batchsize" :value="settings.etherscanBatchSize" @change="setEtherscanBatchSize($event)" :options="etherscanBatchSizeOptions" class="w-25"></b-form-select>
              </b-form-group>
              <b-form-group label="Confirmations:" label-for="import-confirmations" label-size="sm" label-cols-sm="2" label-align-sm="right" :description="'Number of blocks before including a transaction in this dapp'" class="mx-0 my-1 p-0">
                <b-form-select size="sm" id="import-confirmations" :value="settings.confirmations" @change="setConfirmations($event)" :options="confirmationsOptions" class="w-25"></b-form-select>
              </b-form-group>
            </b-form-group>
            <b-form-group label-cols-lg="2" label="Reporting Period" label-size="md" label-class="font-weight-bold pt-0" class="mt-3 mb-0">
              <b-form-group label="Period Start:" label-for="period-start" label-size="sm" label-cols-sm="2" label-align-sm="right" :description="'Reporting periods: [' + periodOptions.map(e => e.text).join(', ') + ']'" class="mx-0 my-1 p-0">
                <b-form-select size="sm" id="period-start" :value="settings.periodStart" @change="setPeriodStart($event)" :options="periodStartOptions" class="w-25"></b-form-select>
              </b-form-group>
            </b-form-group>
            <b-form-group label-cols-lg="2" label="Reset Data" label-size="md" label-class="font-weight-bold pt-0" class="mt-3 mb-0">
              <b-form-group label="Temporary Data:" label-for="reset-localstorage" label-size="sm" label-cols-sm="2" label-align-sm="right" :description="'Reset view preferences stored in your browser LocalStorage'" class="mx-0 my-1 p-0">
                <b-button size="sm" id="reset-localstorage" @click="reset(['localStorage'])" variant="primary">Reset</b-button>
              </b-form-group>
              <b-form-group label="Intermediate Data:" label-for="reset-intermediate" label-size="sm" label-cols-sm="2" label-align-sm="right" :description="'Reset view preferences stored in your browser LocalStorage, plus assets, transactions and ENS names stored in your browser IndexedDB'" class="mx-0 my-1 p-0">
                <b-button size="sm" id="reset-intermediate" @click="reset(['localStorage', 'txs', 'assets', 'ensMap'])" variant="primary">Reset</b-button>
              </b-form-group>
              <b-form-group label="All Data:" label-for="reset-unlock" label-size="sm" label-cols-sm="2" label-align-sm="right" description="Type 'gm' three times above, no spaces, to unlock the button below" class="mx-0 my-1 p-0">
                <b-form-input type="text" size="sm" id="reset-unlock" v-model.trim="unlock" placeholder="gm" class="w-25"></b-form-input>
              </b-form-group>
              <b-form-group label="" label-for="reset-all" label-size="sm" label-cols-sm="2" label-align-sm="right" :description="'Reset view preferences stored in your browser LocalStorage, plus accounts, assets, transactions and ENS names stored in your browser IndexedDB'" class="mx-0 my-1 p-0">
                <b-button size="sm" :disabled="unlock != 'gmgmgm'" id="reset-all" @click="reset(['localStorage', 'accounts', 'txs', 'assets', 'ensMap'])" variant="warning">Reset</b-button>
              </b-form-group>
            </b-form-group>
          </b-card-body>
        </b-card>
      </b-card>
    </div>
  `,
  data: function () {
    return {
      count: 0,
      reschedule: true,
      unlock: null,
      etherscanBatchSizeOptions: [
        { value: 1_000_000, text: '1 million blocks' },
        { value: 5_000_000, text: '5 million blocks' },
        { value: 10_000_000, text: '10 million blocks' },
      ],
      confirmationsOptions: [
        { value: 1, text: '1 block' },
        { value: 5, text: '5 blocks' },
        { value: 10, text: '10 blocks' },
        { value: 20, text: '20 blocks' },
      ],
      periodStartOptions: [
        { value: 'jan', text: 'January' },
        { value: 'feb', text: 'February' },
        { value: 'mar', text: 'March' },
        { value: 'apr', text: 'April' },
        { value: 'may', text: 'May' },
        { value: 'jun', text: 'June' },
        { value: 'jul', text: 'July' },
        { value: 'aug', text: 'August' },
        { value: 'sep', text: 'September' },
        { value: 'oct', text: 'October' },
        { value: 'nov', text: 'November' },
        { value: 'dec', text: 'December' },
      ],
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
    settings() {
      return store.getters['config/settings'];
    },
    periodOptions() {
      return store.getters['config/periodOptions'];
    },
  },
  methods: {
    setEtherscanAPIKey(etherscanAPIKey) {
      store.dispatch('config/setEtherscanAPIKey', etherscanAPIKey);
    },
    setEtherscanBatchSize(etherscanBatchSize) {
      store.dispatch('config/setEtherscanBatchSize', etherscanBatchSize);
    },
    setConfirmations(confirmations) {
      store.dispatch('config/setConfirmations', confirmations);
    },
    setPeriodStart(periodStart) {
      store.dispatch('config/setPeriodStart', periodStart);
    },
    reset(sections) {
      console.log("reset() - sections: " + JSON.stringify(sections));
      for (let section of sections) {
        if (section == 'localStorage') {
          console.log("- deleting localStorage");
          for (let key of ['coinbase', 'accountsSettings', 'transactionsSettings', 'configSettings']) {
            delete localStorage[key];
          }
        } else {
          console.log("- data/resetData: " + section);
          store.dispatch('data/resetData', section);
        }
      }
      alert('Reloading this page in 5 seconds.')
      setTimeout(function() {
        window.location.reload();
      }, 5000);
    },
    async timeoutCallback() {
      logDebug("Config", "timeoutCallback() count: " + this.count);
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
    logDebug("Config", "beforeDestroy()");
  },
  mounted() {
    logDebug("Config", "mounted() $route: " + JSON.stringify(this.$route.params));
    store.dispatch('config/restoreState');
    this.reschedule = true;
    logDebug("Config", "Calling timeoutCallback()");
    this.timeoutCallback();
  },
  destroyed() {
    this.reschedule = false;
  },
};

const configModule = {
  namespaced: true,
  state: {
    settings: {
      etherscanAPIKey: null,
      etherscanBatchSize: 10_000_000,
      confirmations: 10,
      periodStart: 'jul',
      version: 1,
    },
  },
  getters: {
    settings: state => state.settings,
    periodOptions(state) {
      const results = [];
      const startMonth = state.periodStart && state.periodStart.length > 0 && state.periodStart || "jul";
      const now = moment();
      let startPeriod = moment(now).month(startMonth).startOf('month');
      if (startPeriod > now) {
        startPeriod = startPeriod.subtract(1, 'year');
      }
      while (moment(startPeriod).year() >= 2015) {
        const endPeriod = moment(startPeriod).add(1, 'year').subtract(1, 'second');
        results.push({ value: "y" + moment(startPeriod).year(), text: startPeriod.format('MMM DD YYYY') + " - " + endPeriod.format('MMM DD YYYY'), data: { startPeriod, endPeriod } });
        startPeriod = moment(startPeriod).subtract(1, 'year');
      }
      return results;
    },
    quarterlyOptions(state) {
      const results = [];
      const now = moment();
      let startPeriod = moment().quarter(now.quarter()).startOf('quarter');
      while (moment(startPeriod).year() >= 2015) {
        const endPeriod = moment(startPeriod).add(3, 'month').subtract(1, 'second');
        results.push({ value: "q" + startPeriod.format('YYYYQ'), text: startPeriod.format('MMM DD YYYY') + " - " + endPeriod.format('MMM DD YYYY'), data: { startPeriod, endPeriod } });
        startPeriod = moment(startPeriod).subtract(3, 'month');
      }
      return results;
    },
  },
  mutations: {
    setEtherscanAPIKey(state, etherscanAPIKey) {
      state.settings.etherscanAPIKey = etherscanAPIKey;
    },
    setEtherscanBatchSize(state, etherscanBatchSize) {
      state.settings.etherscanBatchSize = etherscanBatchSize;
    },
    setConfirmations(state, confirmations) {
      state.settings.confirmations = confirmations;
    },
    setPeriodStart(state, periodStart) {
      state.settings.periodStart = periodStart;
    },
  },
  actions: {
    restoreState(context) {
      if ('configSettings' in localStorage) {
        const tempSettings = JSON.parse(localStorage.configSettings);
        if ('version' in tempSettings && tempSettings.version == 1) {
          context.state.settings = tempSettings;
        }
      }
    },
    setEtherscanAPIKey(context, etherscanAPIKey) {
      context.commit('setEtherscanAPIKey', etherscanAPIKey);
      localStorage.configSettings = JSON.stringify(context.state.settings);
    },
    setEtherscanBatchSize(context, etherscanBatchSize) {
      context.commit('setEtherscanBatchSize', etherscanBatchSize);
      localStorage.configSettings = JSON.stringify(context.state.settings);
    },
    setConfirmations(context, confirmations) {
      context.commit('setConfirmations', confirmations);
      localStorage.configSettings = JSON.stringify(context.state.settings);
    },
    setPeriodStart(context, periodStart) {
      context.commit('setPeriodStart', periodStart);
      localStorage.configSettings = JSON.stringify(context.state.settings);
    },
  },
};
