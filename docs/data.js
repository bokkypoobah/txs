const Data = {
  template: `
    <div class="mt-5 pt-3">
      <b-card no-body no-header class="border-0">

        <b-card no-body no-header bg-variant="light" class="m-1 p-1 w-75">
          <b-card-body class="m-1 p-1">
            <b-form-group label-cols-lg="2" label="DATA Import Settings" label-size="md" label-class="font-weight-bold pt-0" class="mt-3 mb-0">
              <b-form-group label="Etherscan API Key:" label-for="etherscan-apikey" label-size="sm" label-cols-sm="2" label-align-sm="right" description="This key is stored in your local browser storage and is sent with Etherscan API requests. If not supplied, imports from Etherscan will be rate limited to 1 request every 5 seconds" class="mx-0 my-1 p-0">
                <b-form-input type="text" size="sm" id="etherscan-apikey" :value="etherscanAPIKey" @change="setEtherscanAPIKey($event)" placeholder="See https://docs.etherscan.io/ to obtain an API key" class="w-75"></b-form-input>
              </b-form-group>
            </b-form-group>
            <b-form-group label-cols-lg="2" label="Reporting Period" label-size="md" label-class="font-weight-bold pt-0" class="mt-3 mb-0">
              <b-form-group label="Period Start:" label-for="period-start" label-size="sm" label-cols-sm="2" label-align-sm="right" description="This key is stored in your local browser storage and is sent with Etherscan API requests. If not supplied, imports from Etherscan will be rate limited to 1 request every 5 seconds" class="mx-0 my-1 p-0">
                <b-form-select size="sm" :value="periodStart" @change="setPeriodStart($event)" :options="periodStartOptions" class="w-25"></b-form-select>
              </b-form-group>
            </b-form-group>

            <!-- {{ periodOptions }} -->
          </b-card-body>
        </b-card>

      </b-card>
    </div>
  `,
  data: function () {
    return {
      count: 0,
      reschedule: true,
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
    etherscanAPIKey() {
      return store.getters['data/etherscanAPIKey'];
    },
    periodStart() {
      return store.getters['data/periodStart'];
    },
    periodOptions() {
      return store.getters['data/periodOptions'];
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
    etherscanAPIKey: null,
    periodStart: null,
  },
  getters: {
    etherscanAPIKey: state => state.etherscanAPIKey,
    periodStart: state => state.periodStart,
    periodOptions(state) {
      const results = [];
      // results.push({ value: null, text: "(select period)", data: null });
      const startMonth = state.periodStart || "jul";
      const now = moment();
      let startPeriod = moment(now).month(startMonth).startOf('month');
      if (startPeriod > now) {
        startPeriod = startPeriod.subtract(1, 'year');
      }
      while (moment(startPeriod).year() >= 2015) {
        const endPeriod = moment(startPeriod).add(1, 'year').subtract(1, 'second');
        results.push({ value: "y" + moment(startPeriod).year(), text: startPeriod.format('MMM DD YYYY') + " to " + endPeriod.format('MMM DD YYYY'), data: { startPeriod, endPeriod } });
        startPeriod = moment(startPeriod).subtract(1, 'year');
      }
      // results.push({ value: "nodata", text: "(tx hashes with no data)", data: null });
      return results;
    },
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
        context.commit('setEtherscanAPIKey', localStorage.txsEtherscanAPIKey);
      }
      if ('txsPeriodStart' in localStorage) {
        context.commit('setPeriodStart', localStorage.txsPeriodStart);
      }
      logInfo("dataModule", "actions.restoreState() - state: " + JSON.stringify(context.state));
    },
    setEtherscanAPIKey(context, p) {
      // logInfo("dataModule", "actions.setEtherscanAPIKey(" + JSON.stringify(p) + ")");
      context.commit('setEtherscanAPIKey', p);
      localStorage.txsEtherscanAPIKey = p;
    },
    setPeriodStart(context, p) {
      // logInfo("dataModule", "actions.setPeriodStart(" + JSON.stringify(p) + ")");
      context.commit('setPeriodStart', p);
      localStorage.txsPeriodStart = p;
    },
  },
};
