const Config = {
  template: `
    <div class="mt-5 pt-3">
      <b-card no-body no-header class="border-0">
        <b-card no-body no-header bg-variant="light" class="m-1 p-1 w-75">
          <b-card-body class="m-1 p-1">
            <b-form-group label-cols-lg="2" label="Import Settings" label-size="md" label-class="font-weight-bold pt-0" class="mt-3 mb-0">
              <b-form-group label="Etherscan API Key:" label-for="etherscan-apikey" label-size="sm" label-cols-sm="2" label-align-sm="right" description="This key is stored in your local browser storage and is sent with Etherscan API requests. If not supplied, imports from Etherscan will be rate limited to 1 request every 5 seconds" class="mx-0 my-1 p-0">
                <b-form-input type="text" size="sm" id="etherscan-apikey" :value="settings.etherscanAPIKey" @change="setEtherscanAPIKey($event)" placeholder="See https://docs.etherscan.io/ to obtain an API key" class="w-75"></b-form-input>
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
      periodStartOptions: [
        { value: null, text: '(select ▼)' },
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
      alert('Reloading this page.')
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
      periodStart: 'jul',
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
  },
  mutations: {
    setEtherscanAPIKey(state, etherscanAPIKey) {
      state.settings.etherscanAPIKey = etherscanAPIKey;
    },
    setPeriodStart(state, periodStart) {
      state.settings.periodStart = periodStart;
    },
  },
  actions: {
    restoreState(context) {
      if ('configSettings' in localStorage) {
        context.state.settings = JSON.parse(localStorage.configSettings);
        console.log("config.restoreState: " + JSON.stringify(context.state.settings));
      }
    },
    setEtherscanAPIKey(context, etherscanAPIKey) {
      context.commit('setEtherscanAPIKey', etherscanAPIKey);
      localStorage.configSettings = JSON.stringify(context.state.settings);
    },
    setPeriodStart(context, periodStart) {
      context.commit('setPeriodStart', periodStart);
      localStorage.configSettings = JSON.stringify(context.state.settings);
    },
  },
};
