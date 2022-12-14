const Report = {
  template: `
    <div class="m-0 p-0">
      <b-card no-body no-header class="border-0">

        <div class="d-flex flex-wrap m-0 p-0">
          <div class="mt-0 pr-1" style="max-width: 8.0rem;">
            <b-form-input type="text" size="sm" v-model.trim="settings.txhashFilter" @change="saveSettings" debounce="600" v-b-popover.hover.top="'Filter by tx hash fragment'" placeholder="🔍 txhash"></b-form-input>
          </div>
          <div class="mt-0 pr-1" style="max-width: 8.0rem;">
            <b-form-input type="text" size="sm" v-model.trim="settings.accountFilter" @change="saveSettings" debounce="600" v-b-popover.hover.top="'Filter by address fragment'" placeholder="🔍 address"></b-form-input>
          </div>
          <div v-if="false" class="mt-0 pr-1">
            <b-form-select size="sm" v-model="settings.accountTypeFilter" @change="saveSettings" :options="accountTypeFilters" v-b-popover.hover.top="'Filter by account types'"></b-form-select>
          </div>
          <div v-if="false" class="mt-0 pr-1">
            <b-form-select size="sm" v-model="settings.accountMineFilter" @change="saveSettings" :options="accountMineFilters" v-b-popover.hover.top="'Filter for my accounts, or not'"></b-form-select>
          </div>
          <div class="mt-0 pr-1">
            <b-form-select size="sm" v-model="settings.period" @change="saveSettings" :options="periodOptions" v-b-popover.hover.top="'Filter by period'"></b-form-select>
          </div>
          <div class="mt-0 flex-grow-1">
          </div>
          <div v-if="sync.section == null" class="mt-0 pr-1">
            <b-button size="sm" :disabled="block == null" @click="syncIt({ sections: ['importFromEtherscan', 'downloadData', 'buildAssets', 'getExchangeRates'], parameters: [] })" variant="link" v-b-popover.hover.top="'Import Etherscan transactions and web3 transfer events for accounts configured to be synced'"><b-icon-cloud-download shift-v="+1" font-scale="1.2"></b-icon-cloud-download></b-button>
          </div>
          <div v-if="sync.section == null" class="mt-0 pr-1">
            <b-button size="sm" :disabled="block == null" @click="syncIt({ sections: ['downloadData'], parameters: Object.keys(settings.selectedAccounts) })" variant="link" v-b-popover.hover.top="'Import transaction data via web3 for accounts configured to be synced'"><b-icon-cloud shift-v="+1" font-scale="1.2"></b-icon-cloud></b-button>
          </div>
          <div v-if="sync.section == null" class="mt-0 pr-1">
            <b-button size="sm" :disabled="block == null" @click="syncIt({ sections: ['getExchangeRates'], parameters: [] })" variant="link" v-b-popover.hover.top="'Get exchange rates'"><b-icon-bar-chart shift-v="+1" font-scale="1.2"></b-icon-bar-chart></b-button>
          </div>
          <div v-if="sync.section == null" class="mt-0 pr-1">
            <b-button size="sm" :disabled="block == null" @click="generateReport(contractOrTxOrBlockRange)" variant="link" v-b-popover.hover.top="'Generate Report'"><b-icon-newspaper shift-v="+1" font-scale="1.2"></b-icon-newspaper></b-button>
          </div>
          <!--
          <div v-if="sync.section == null" class="mt-0 pr-1">
            <b-button size="sm" @click="syncIt({ sections: ['computeTxs'], parameters: Object.keys(settings.selectedTransactions) })" variant="link" v-b-popover.hover.top="'Compute selected transactions'"><b-icon-arrow-clockwise shift-v="+1" font-scale="1.2"></b-icon-arrow-clockwise></b-button>
          </div>
          -->
          <div v-if="sync.section == null" class="mt-0 pr-1">
            <b-button size="sm" @click="exportTransactions" variant="link" v-b-popover.hover.top="'Export transactions'"><b-icon-file-earmark-spreadsheet shift-v="+1" font-scale="1.2"></b-icon-file-earmark-spreadsheet></b-button>
          </div>
          <div v-if="sync.section != null" class="mt-1" style="width: 200px;">
            <b-progress height="1.5rem" :max="sync.total" show-progress :animated="sync.section != null" :variant="sync.section != null ? 'success' : 'secondary'" v-b-popover.hover.top="'Click the button on the right to stop. This process can be continued later'">
              <b-progress-bar :value="sync.completed">
                {{ sync.total == null ? (sync.completed + ' ' + sync.section) : (sync.completed + '/' + sync.total + ' ' + ((sync.completed / sync.total) * 100).toFixed(0) + '% ' + sync.section) }}
              </b-progress-bar>
            </b-progress>
          </div>
          <div class="ml-0 mt-1">
            <b-button v-if="sync.section != null" size="sm" @click="halt" variant="link" v-b-popover.hover.top="'Click to stop. This process can be continued later'"><b-icon-stop-fill shift-v="+1" font-scale="1.0"></b-icon-stop-fill></b-button>
          </div>
          <!--
          <div class="mt-0 flex-grow-1">
          </div>
          <div class="mt-0 pr-1">
            <b-button size="sm" @click="exportAddresses" variant="link">Export</b-button>
          </div>
          -->
          <div class="mt-0 flex-grow-1">
          </div>
          <div class="mt-0 pr-1">
            <b-form-select size="sm" v-model="settings.sortOption" @change="saveSettings" :options="sortOptions" v-b-popover.hover.top="'Yeah. Sort'"></b-form-select>
          </div>
          <div class="mt-0 pr-1">
            <font size="-2" v-b-popover.hover.top="'# transactions'">{{ filteredSortedTransactions.length + '/' + totalTransactions }}</font>
          </div>
          <div class="mt-0 pr-1">
            <b-pagination size="sm" v-model="settings.currentPage" @input="saveSettings" :total-rows="filteredSortedTransactions.length" :per-page="settings.pageSize" style="height: 0;"></b-pagination>
          </div>
          <div class="mt-0 pl-1">
            <b-form-select size="sm" v-model="settings.pageSize" @change="saveSettings" :options="pageSizes" v-b-popover.hover.top="'Page size'"></b-form-select>
          </div>
        </div>

        <b-table small fixed striped responsive hover :fields="transactionsFields" :items="pagedFilteredSortedTransactions" show-empty empty-html="Add [Accounts] then sync" head-variant="light" class="m-0 mt-1">
          <!--
          <template #thead-top="data">
            <b-tr>
              <b-th colspan="2"><span class="sr-only">Name and ID</span></b-th>
              <b-th variant="secondary">Type 1</b-th>
              <b-th variant="primary" colspan="3">Type 2</b-th>
              <b-th variant="danger">Type 3</b-th>
            </b-tr>
          </template>
          -->
          <template #head(number)="data">
            <b-dropdown size="sm" variant="link" v-b-popover.hover="'Toggle selection'">
              <template #button-content>
                <b-icon-check-square shift-v="+1" font-scale="0.9"></b-icon-check-square>
              </template>
              <b-dropdown-item href="#" @click="toggleSelectedTransactions(pagedFilteredSortedTransactions)">Toggle selection for all transactions on this page</b-dropdown-item>
              <b-dropdown-item href="#" @click="toggleSelectedTransactions(filteredSortedTransactions)">Toggle selection for all transactions on all pages</b-dropdown-item>
              <b-dropdown-item href="#" @click="clearSelectedTransactions()">Clear selection</b-dropdown-item>
            </b-dropdown>
          </template>
          <template #cell(number)="data">
            <b-form-checkbox size="sm" :checked="settings.selectedTransactions[data.item.txHash] ? 1 : 0" value="1" @change="toggleSelectedTransactions([data.item])">
              {{ parseInt(data.index) + ((settings.currentPage - 1) * settings.pageSize) + 1 }}
            </b-form-checkbox>
          </template>
          <template #cell(timestamp)="data">
            <b-link class="sm" :id="'popover-target-' + data.item.txHash">
              {{ formatTimestamp(data.item.timestamp) }}
            </b-link>
            <br />
            <font size="-2">
              {{ data.item.txHash }}
            </font>
            <b-popover :target="'popover-target-' + data.item.txHash" placement="right" custom-class="popover-max-width">
              <template #title>
                {{ 'Tx: ' + data.item.txHash.substring(0, 16) + '...' }}
              </template>
              <b-link @click="copyToClipboard(data.item.txHash);">Copy tx hash to clipboard</b-link>
              <br />
              <b-link :href="'https://etherscan.io/tx/' + data.item.txHash" target="_blank">View tx in etherscan.io</b-link>
              <br />
            </b-popover>
          </template>
          <template #cell(from)="data">
            <b-link class="sm" :id="'popover-target-' + data.item.txHash + '-' + data.item.from">
              {{ ensOrAccount(data.item.from) }}
            </b-link>
            <b-popover :target="'popover-target-' + data.item.txHash + '-' + data.item.from" placement="right" custom-class="popover-max-width">
              <template #title>
                {{ 'From: ' + ensOrAccount(data.item.from, 20) }}
              </template>
              <b-link @click="copyToClipboard(data.item.from);">Copy from account to clipboard</b-link>
              <br />
              <span v-if="ensOrNull(data.item.from) != null && ensOrNull(data.item.from).length > 0">
                <b-link @click="copyToClipboard(ensOrNull(data.item.from));">Copy 'from' account ENS name to clipboard</b-link>
                <br />
                <b-link :href="'https://app.ens.domains/name/' + ensOrNull(data.item.from)" target="_blank">View 'from' account ENS name in app.ens.domains</b-link>
                <br />
              </span>
              <b-link :href="'https://etherscan.io/address/' + data.item.from" target="_blank">View 'from' account in etherscan.io</b-link>
              <br />
              <b-link :href="'https://opensea.io/' + data.item.from" target="_blank">View 'from' account in opensea.io</b-link>
              <br />
              <b-link :href="'https://opensea.io/' + data.item.from + '?tab=bids'" target="_blank">View offers received in opensea.io for 'from' account</b-link>
              <br />
              <b-link :href="'https://looksrare.org/accounts/' + data.item.from + '#owned'" target="_blank">View 'from' account in looksrare.org</b-link>
              <br />
              <b-link :href="'https://x2y2.io/user/' + data.item.from + '/items'" target="_blank">View 'from' account in x2y2.io</b-link>
              <br />
              <b-link :href="'https://www.gem.xyz/profile/' + data.item.from" target="_blank">View 'from' account in gem.xyz</b-link>
              <br />
              <b-link :href="'https://blur.io/' + data.item.from" target="_blank">View 'from' account in blur.io</b-link>
              <br />
            </b-popover>
          </template>
          <template #cell(to)="data">
            <b-link class="sm" :id="'popover-target-' + data.item.txHash + '-' + data.item.to">
              {{ ensOrAccount(data.item.to) }}
            </b-link>
            <b-popover :target="'popover-target-' + data.item.txHash + '-' + data.item.to" placement="right" custom-class="popover-max-width">
              <template #title>
                {{ 'To: ' + ensOrAccount(data.item.to, 20) }}
              </template>
              <b-link @click="copyToClipboard(data.item.to);">Copy 'to' account to clipboard</b-link>
              <br />
              <span v-if="ensOrNull(data.item.to) != null && ensOrNull(data.item.to).length > 0">
                <b-link @click="copyToClipboard(ensOrNull(data.item.to));">Copy 'to' account ENS name to clipboard</b-link>
                <br />
                <b-link :href="'https://app.ens.domains/name/' + ensOrNull(data.item.to)" target="_blank">View 'to' account ENS name in app.ens.domains</b-link>
                <br />
              </span>
              <b-link :href="'https://etherscan.io/address/' + data.item.to" target="_blank">View 'to' account in etherscan.io</b-link>
              <br />
              <b-link :href="'https://opensea.io/' + data.item.to" target="_blank">View 'to' account in opensea.io</b-link>
              <br />
              <b-link :href="'https://opensea.io/' + data.item.to + '?tab=bids'" target="_blank">View offers received in opensea.io for 'to' account</b-link>
              <br />
              <b-link :href="'https://looksrare.org/accounts/' + data.item.to + '#owned'" target="_blank">View 'to' account in looksrare.org</b-link>
              <br />
              <b-link :href="'https://x2y2.io/user/' + data.item.to + '/items'" target="_blank">View 'to' account in x2y2.io</b-link>
              <br />
              <b-link :href="'https://www.gem.xyz/profile/' + data.item.to" target="_blank">View 'to' account in gem.xyz</b-link>
              <br />
              <b-link :href="'https://blur.io/' + data.item.to" target="_blank">View 'to' account in blur.io</b-link>
              <br />
            </b-popover>

          </template>
          <template #cell(value)="data">
            {{ formatETH(data.item.value) }}
          </template>
        </b-table>

      </b-card>
    </div>
  `,
  props: ['contractOrTxOrBlockRange'],
  data: function () {
    return {
      count: 0,
      reschedule: true,
      settings: {
        txhashFilter: null,
        accountFilter: null,
        accountTypeFilter: null,
        accountMineFilter: null,
        period: null,
        selectedTransactions: {},
        currentPage: 1,
        pageSize: 100,
        sortOption: 'timestampdsc',
        version: 1,
      },
      accountTypes: [
        { value: null, text: '(unknown)' },
        { value: 'eoa', text: 'EOA' },
        { value: 'contract', text: 'Contract' },
        { value: 'erc721', text: 'ERC-721' },
        { value: 'erc1155', text: 'ERC-1155' },
        { value: 'erc20', text: 'ERC-20' },
      ],
      accountTypeFilters: [
        { value: null, text: '(all)' },
        { value: 'eoa', text: 'EOA' },
        { value: 'contract', text: 'Contract' },
        { value: 'erc721', text: 'ERC-721' },
        { value: 'erc1155', text: 'ERC-1155' },
        { value: 'erc20', text: 'ERC-20' },
        { value: 'unknown', text: '(unknown)' },
      ],
      accountMineFilters: [
        { value: null, text: '(any)' },
        { value: 'mine', text: 'Mine' },
        { value: 'notmine', text: 'Not Mine' },
      ],
      sortOptions: [
        { value: 'timestampasc', text: '▲ Timestamp' },
        { value: 'timestampdsc', text: '▼ Timestamp' },
        { value: 'blocknumberasc', text: '▲ Block Number' },
        { value: 'blocknumberdsc', text: '▼ Block Number' },
        // { value: 'groupasc', text: '▲ Group, ▲ Name' },
        // { value: 'groupdsc', text: '▼ Group, ▲ Name' },
        // { value: 'nameasc', text: '▲ Name, ▲ Group' },
        // { value: 'namedsc', text: '▼ Name, ▲ Group' },
      ],
      pageSizes: [
        { value: 1, text: '1' },
        { value: 5, text: '5' },
        { value: 10, text: '10' },
        { value: 25, text: '25' },
        { value: 50, text: '50' },
        { value: 100, text: '100' },
        { value: 500, text: '500' },
        { value: 1000, text: '1k' },
        { value: 2500, text: '2.5k' },
        { value: 10000, text: '10k' },
      ],
      transactionsFields: [
        { key: 'number', label: '#', sortable: false, thStyle: 'width: 5%;', tdClass: 'text-truncate' },
        { key: 'timestamp', label: 'When', sortable: false, thStyle: 'width: 15%;', tdClass: 'text-truncate' },
        // { key: 'txHash', label: 'Tx Hash', sortable: false, thStyle: 'width: 20%;', tdClass: 'text-truncate' },
        { key: 'from', label: 'From', sortable: false, thStyle: 'width: 15%;', tdClass: 'text-truncate' },
        { key: 'to', label: 'To', sortable: false, thStyle: 'width: 15%;', tdClass: 'text-truncate' },
        { key: 'info', label: 'Info', sortable: false, thStyle: 'width: 50%;', tdClass: 'text-truncate' },
        // { key: 'account', label: 'Account', sortable: false, thStyle: 'width: 35%;', tdClass: 'text-truncate' },
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
    block() {
      return store.getters['connection/block'];
    },
    periodOptions() {
      const results = [];
      results.push({ value: null, text: "All", data: { startPeriod: null, endPeriod: null } });
      results.push({ label: 'Annual Periods', options: store.getters['config/periodOptions'] });
      results.push({ label: 'Quarterly Periods', options: store.getters['config/quarterlyOptions'] });
      // results.push({ value: "nodata", text: "(tx hashes with no data)", data: null });
      return results;
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
    sync() {
      return store.getters['data/sync'];
    },
    coinbaseIncluded() {
      const key = this.network.chainId + ':' + this.coinbase;
      return (key in this.accounts);
    },
    totalTransactions() {
      let result = 0;
      for (const [chainId, chainData] of Object.entries(this.txs)) {
        result = parseInt(result) + Object.keys(chainData).length;
      }
      return result;
    },
    filteredTransactions() {
      const results = [];
      let startPeriod = null;
      let endPeriod = null;
      const txhashFilterLower = this.settings.txhashFilter && this.settings.txhashFilter.toLowerCase() || null;
      const accountFilterLower = this.settings.accountFilter && this.settings.accountFilter.toLowerCase() || null;
      if (this.settings.period != null && this.settings.period != "nodata") {
        const periodRecords = this.periodOptions.filter(e => e.value == this.settings.period);
        if (periodRecords.length > 0) {
          startPeriod = periodRecords[0].data.startPeriod;
          endPeriod = periodRecords[0].data.endPeriod;
        } else {
          const quarterlyRecords = store.getters['config/quarterlyOptions'].filter(e => e.value == this.settings.period);
          if (quarterlyRecords.length > 0) {
            startPeriod = quarterlyRecords[0].data.startPeriod;
            endPeriod = quarterlyRecords[0].data.endPeriod;
          }
        }
      }
      for (const [chainId, chainData] of Object.entries(this.txs)) {
        for (const [txHash, item] of Object.entries(chainData)) {
          let include = true;
          if (startPeriod != null && item.timestamp < startPeriod.unix()) {
            include = false;
          }
          if (include && endPeriod != null && item.timestamp > endPeriod.unix()) {
            include = false;
          }
          if (include && txhashFilterLower != null) {
            if (!(txHash.includes(txhashFilterLower))) {
              include = false;
            }
          }
          if (include && accountFilterLower != null) {
            const fromENS = this.ensMap[item.tx.from] || null;
            if (
              !(item.tx.from.toLowerCase().includes(accountFilterLower)) &&
              !(item.tx.to.toLowerCase().includes(accountFilterLower)) &&
              !(fromENS != null && fromENS.toLowerCase().includes(accountFilterLower))
            ) {
              include = false;
            }
          }
          if (include) {
            const info = parseTxOld(item, null);
            results.push({
              chainId,
              txHash,
              blockNumber: item.blockNumber,
              transactionIndex: item.transactionIndex,
              timestamp: item.timestamp,
              from: item.tx.from,
              to: item.tx.to,
              value: item.tx.value,
              ...info,
            });
          }
        }
      }
      return results;
    },
    filteredSortedTransactions() {
      const results = this.filteredTransactions;
      if (this.settings.sortOption == 'timestampasc') {
        results.sort((a, b) => a.timestamp - b.timestamp);
      } else if (this.settings.sortOption == 'timestampdsc') {
        results.sort((a, b) => b.timestamp - a.timestamp);
      } else if (this.settings.sortOption == 'blocknumberasc') {
        results.sort((a, b) => {
          if (a.blockNumber == b.blockNumber) {
            return a.transactionIndex - b.transactionIndex;
          } else {
            return a.blockNumber - b.blockNumber;
          }
        });
      } else if (this.settings.sortOption == 'blocknumberdsc') {
        results.sort((a, b) => {
          if (a.blockNumber == b.blockNumber) {
            return b.transactionIndex - a.transactionIndex;
          } else {
            return b.blockNumber - a.blockNumber
          }
        });
      }
      return results;
    },
    pagedFilteredSortedTransactions() {
      return this.filteredSortedTransactions.slice((this.settings.currentPage - 1) * this.settings.pageSize, this.settings.currentPage * this.settings.pageSize);
    },
  },
  methods: {
    formatTimestamp(ts) {
      if (ts != null) {
        return moment.unix(ts).format("YYYY-MM-DD HH:mm:ss");
      }
      return null;
    },
    formatETH(e) {
      try {
        return e ? parseFloat(ethers.utils.formatEther(e)).toFixed(9) : null;
      } catch (err) {
      }
      return e.toFixed(9);
    },
    saveSettings() {
      localStorage.reportSettings = JSON.stringify(this.settings);
    },
    generateReport(contractOrTxOrBlockRange) {
      console.log("UI generateReport: " + contractOrTxOrBlockRange);
      store.dispatch('report/generateReport', contractOrTxOrBlockRange);
    },
    addNewAccounts() {
      store.dispatch('data/addNewAccounts', this.settings.newAccounts);
    },
    addCoinbase() {
      store.dispatch('data/addNewAccounts', this.coinbase);
    },
    toggleSelectedTransactions(items) {
      let someFalse = false;
      let someTrue = false;
      for (const item of items) {
        if (this.settings.selectedTransactions[item.txHash]) {
          someTrue = true;
        } else {
          someFalse = true;
        }
      }
      for (const item of items) {
        if (!(someTrue && !someFalse)) {
          Vue.set(this.settings.selectedTransactions, item.txHash, true);
        } else {
          Vue.delete(this.settings.selectedTransactions, item.txHash);
        }
      }
      this.saveSettings();
    },
    clearSelectedTransactions() {
      this.settings.selectedTransactions = {};
      this.saveSettings();
    },
    async syncIt(info) {
      store.dispatch('data/syncIt', info);
    },
    async halt() {
      store.dispatch('data/setSyncHalt', true);
    },
    ensOrAccount(account, length = 0) {
      let result = null;
      if (this.ensMap && account in this.ensMap) {
        result = this.ensMap[account];
      }
      if (result == null || result.length == 0) {
        result = account;
      }
      return result == null || result.length == 0 ? null : (length == 0 ? result : result.substring(0, length));
    },
    hasENS(account) {
      if (this.ensMap && account in this.ensMap) {
        result = this.ensMap[account];
        if (result != account) {
          return true;
        }
      }
      return false;
    },
    ensOrNull(account, length = 0) {
      let result = null;
      if (this.ensMap && account in this.ensMap) {
        result = this.ensMap[account];
        if (result == account) {
          result = null;
        }
      }
      return result == null || result.length == 0 ? null : (length == 0 ? result : result.substring(0, length));
    },
    copyToClipboard(str) {
      // https://github.com/30-seconds/30-seconds-of-code/blob/master/snippets/copyToClipboard.md
      const el = document.createElement('textarea');
      el.value = str;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      const selected =
        document.getSelection().rangeCount > 0
          ? document.getSelection().getRangeAt(0)
          : false;
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      if (selected) {
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(selected);
      }
    },
    exportTransactions() {
      console.log("exportTransactions");
      const rows = [
          ["No", "TxHash", "From", "FromENS", "To", "ToENS", "FunctionName", "InputFragment"],
      ];
      let i = 1;
      for (const result of this.filteredSortedTransactions) {
        const fromENS = this.ensMap[result.from] || null;
        rows.push([
          i,
          result.txHash,
          result.from,
          this.ensMap[result.from] || null,
          result.to,
          this.ensMap[result.to] || null,
          result.functionName || null,
          result.input && result.input.substring(0, 100) || null,
        ]);
        i++;
      }
      let csvContent = "data:text/tsv;charset=utf-8," + rows.map(e => e.join("\t")).join("\n");
      var encodedUri = encodeURI(csvContent);
      var link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "txs_transactions_export-" + moment().format("YYYY-MM-DD-HH-mm-ss") + ".tsv");
      document.body.appendChild(link); // Required for FF
      link.click(); // This will download the data with the specified file name
    },
    async timeoutCallback() {
      logDebug("Report", "timeoutCallback() count: " + this.count);
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
    logDebug("Report", "beforeDestroy()");
  },
  mounted() {
    logInfo("Report", "mounted() $route: " + JSON.stringify(this.$route.params) + ", props['contractOrTxOrBlockRange']: " + this.contractOrTxOrBlockRange);
    store.dispatch('data/restoreState');
    if ('reportSettings' in localStorage) {
      const tempSettings = JSON.parse(localStorage.reportSettings);
      if ('version' in tempSettings && tempSettings.version == 1) {
        this.settings = tempSettings;
        this.settings.currentPage = 1;
      }
    }
    this.reschedule = true;
    logDebug("Report", "Calling timeoutCallback()");
    this.timeoutCallback();
  },
  destroyed() {
    this.reschedule = false;
  },
};

const reportModule = {
  namespaced: true,
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {
    async generateReport(context, contractOrTxOrBlockRange) {
      logInfo("reportModule", "generateReport(): " + contractOrTxOrBlockRange);
      const allAccounts = store.getters['data/accounts'];
      const allTxs = store.getters['data/txs'];
      const exchangeRates = store.getters['data/exchangeRates'];
      const blockRange = contractOrTxOrBlockRange ? contractOrTxOrBlockRange.match(/(\d+)-(\d+)/) : null;
      let startBlock = 0;
      let endBlock = 999999999999;
      let contractOrTx = null;
      if (blockRange != null) {
        startBlock = blockRange[1];
        endBlock = blockRange[2];
      } else {
        contractOrTx = contractOrTxOrBlockRange;
      }
      const accumulatedData = {};
      for (const [chainId, accounts] of Object.entries(allAccounts)) {
        const txs = allTxs[chainId] || {};
        // console.log(JSON.stringify(txs, null, 2));
        for (const [account, accountData] of Object.entries(accounts)) {
          if (accountData.mine && accountData.report) {
            console.log("--- Processing " + chainId + ":" + account + " ---");
            const txHashes = {};
            const missingTxDataHashes = {};
            for (const [txHash, logIndexes] of Object.entries(accountData.events)) {
              for (const [logIndex, event] of Object.entries(logIndexes)) {
                if (txHash in txs) {
                  txHashes[txHash] = event.blockNumber;
                } else {
                  missingTxDataHashes[txHash] = event.blockNumber;
                }
              }
            }
            for (const [txHash, traceIds] of Object.entries(accountData.internalTransactions)) {
              for (const [traceId, tx] of Object.entries(traceIds)) {
                if (txHash in txs) {
                  txHashes[txHash] = tx.blockNumber;
                } else {
                  missingTxDataHashes[txHash] = null;
                }
              }
            }
            for (const [txHash, tx] of Object.entries(accountData.transactions)) {
              if (txHash in txs) {
                txHashes[txHash] = tx.blockNumber;
              } else {
                missingTxDataHashes[txHash] = tx.blockNumber;
              }
            }
            const txList = [];
            for (const [txHash, blockNumber] of Object.entries(txHashes)) {
              txList.push(txs[txHash]);
            }
            txList.sort((a, b) => {
              const aBlockNumber = parseInt(a.tx.blockNumber);
              const bBlockNumber = parseInt(b.tx.blockNumber);
              if (aBlockNumber == bBlockNumber) {
                return parseInt(a.tx.transactionIndex) - parseInt(b.tx.transactionIndex);
              } else {
                return aBlockNumber - bBlockNumber;
              }
            });

            // let ethBalance = ethers.BigNumber.from(0);
            for (const txData of txList) {
              if ((!contractOrTx || txData.tx.to == contractOrTx || txData.tx.hash == contractOrTx) && txData.tx.blockNumber >= startBlock && txData.tx.blockNumber <= endBlock) {
                // console.log("txData: " + JSON.stringify(txData));
                // console.log(moment.unix(txData.timestamp).format("YYYY-MM-DD HH:mm:ss") + " " + txData.tx.blockNumber + " " + txData.tx.transactionIndex + " " + txData.tx.hash + " " + txData.tx.from.substring(0, 12) + " -> " + (txData.tx.to && txData.tx.to.substring(0, 12) || 'null'));
                const exchangeRate = getExchangeRate(moment.unix(txData.timestamp), exchangeRates);
                const results = parseTx(chainId, account, accounts, txData);
                accumulateTxResults(accumulatedData, txData, results);
                // console.log("  exchangeRate: " + JSON.stringify(exchangeRate));
                // ethBalance = ethBalance.add(results.ethReceived).sub(results.ethPaid).sub(results.txFee);
                // console.log((results.info || "TODO") + " eth +:" + ethers.utils.formatEther(results.ethReceived) + ", -:" + ethers.utils.formatEther(results.ethPaid) + ", txFee: " + ethers.utils.formatEther(results.txFee) + ", ethBalance: " + ethers.utils.formatEther(ethBalance));
              }
            }
            console.log("missingTxDataHashes: " + JSON.stringify(missingTxDataHashes));
          }
        }
      }
    },
  },
};
