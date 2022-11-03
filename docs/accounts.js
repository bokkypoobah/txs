const Accounts = {
  template: `
    <div class="mt-5 pt-3">
      <b-card no-body no-header class="border-0">

        <div class="d-flex flex-wrap m-0 p-0">
          <div class="mt-0 pr-1">
            <b-form-input type="text" size="sm" v-model.trim="settings.filter" @change="saveSettings" debounce="600" v-b-popover.hover.top="'Filter by address fragment'" placeholder="🔍 address"></b-form-input>
          </div>
          <div class="mt-0 pr-1">
            <b-form-select size="sm" v-model="settings.accountTypeFilter" @change="saveSettings" :options="accountTypeFilters" v-b-popover.hover.top="'Filter by account types'"></b-form-select>
          </div>
          <div class="mt-0 pr-1">
            <b-form-select size="sm" v-model="settings.accountMineFilter" @change="saveSettings" :options="accountMineFilters" v-b-popover.hover.top="'Filter for my accounts, or not'"></b-form-select>
          </div>
          <!--
          <div class="mt-0 flex-grow-1">
          </div>
          <div class="mt-0 pr-1">
            <b-button size="sm" :disabled="sync.section != null" @click="processIt('computeAddresses')" variant="link" v-b-popover.hover.top="'Perform computations on addresses'"><b-icon-caret-right-square shift-v="+1" font-scale="0.9"></b-icon-caret-right-square></b-button>
          </div>
          -->
          <div class="mt-0 flex-grow-1">
          </div>
          <div class="mt-0 pr-0">
            <b-button size="sm" :pressed.sync="settings.showNewAccounts" @click="saveSettings" variant="link" v-b-popover.hover.top="'Add new accounts'"><span v-if="settings.showNewAccounts"><b-icon-plus-square-fill shift-v="+1" font-scale="1.0"></b-icon-plus-square-fill></span><span v-else><b-icon-plus-square shift-v="+1" font-scale="1.0"></b-icon-plus-square></span></b-button>
          </div>
          <!--
          <div class="mt-0 pr-1">
            <b-button size="sm" :pressed.sync="settings.editAddresses" @click="settingsUpdated" :variant="settings.editAddresses ? 'danger' : 'link'" v-b-popover.hover.top="settings.editAddresses ? 'End editing address attributes' : 'Edit address attributes'"><b-icon-pencil shift-v="+1" font-scale="1.0"></b-icon-pencil></b-button>
          </div>
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
            <font size="-2" v-b-popover.hover.top="'# accounts'">{{ filteredSortedAccounts.length }}</font>
          </div>
          <div class="mt-0 pr-1">
            <b-pagination size="sm" v-model="settings.currentPage" @input="saveSettings" :total-rows="filteredSortedAccounts.length" :per-page="settings.pageSize" style="height: 0;"></b-pagination>
          </div>
          <div class="mt-0 pl-1">
            <b-form-select size="sm" v-model="settings.pageSize" @change="saveSettings" :options="pageSizes" v-b-popover.hover.top="'Page size'"></b-form-select>
          </div>
        </div>

        <b-card v-if="settings.showNewAccounts" no-body no-header bg-variant="light" class="m-1 p-1 w-75">
          <b-card-body class="m-1 p-1">
            <b-form-group label-cols-lg="2" label="New Accounts" label-size="md" label-class="font-weight-bold pt-0" class="mb-0">
              <b-form-group label="Accounts:" label-for="newaccounts-accounts" label-size="sm" label-cols-sm="2" label-align-sm="right" description="List of Ethereum accounts. These are saved in your local browser storage and will be transmitted in web3 and Etherscan API calls" class="mx-0 my-1 p-0">
                <b-form-textarea size="sm" id="newaccounts-accounts" v-model.trim="settings.newAccounts" rows="1" max-rows="5" placeholder="0x1234... 0x2345..., 0xAbCd..."></b-form-textarea>
              </b-form-group>
              <b-form-group label="" label-for="newaccounts-submit" label-size="sm" label-cols-sm="2" label-align-sm="right" description="Only valid accounts will be added below. Click the + to the right to show details and click Import" class="mx-0 my-1 p-0">
                <b-button size="sm" id="newaccounts-submit" :disabled="settings.newAccounts == null || settings.newAccounts.length == 0" @click="addNewAccounts" variant="primary">Add</b-button>
              </b-form-group>
            </b-form-group>

          </b-card-body>
        </b-card>

        <!-- <b-table small fixed striped selectable responsive hover :fields="addressesFields" :items="pagedFilteredSortedAccounts" show-empty empty-html="Click [+] above to add addresses and Ethereum transaction hashes, and set your Etherscan API key for imports. Click on your address on the top right to add it" head-variant="light" class="m-0 mt-1"> -->
        <b-table small fixed striped selectable responsive hover :items="pagedFilteredSortedAccounts" show-empty empty-html="Click [+] above to add accounts. Click on your account on the top right to add it" head-variant="light" class="m-0 mt-1">
        </b-table>

      </b-card>
    </div>
  `,
  data: function () {
    return {
      count: 0,
      reschedule: true,
      settings: {
        filter: null,
        accountTypeFilter: null,
        accountMineFilter: null,
        showNewAccounts: false,
        newAccounts: null,
        currentPage: 1,
        pageSize: 10,
        sortOption: 'accountasc',
      },
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
        { value: 'accountasc', text: '▲ Account' },
        { value: 'accountdsc', text: '▼ Account' },
        { value: 'groupasc', text: '▲ Group, ▲ Name' },
        { value: 'groupdsc', text: '▼ Group, ▲ Name' },
        { value: 'nameasc', text: '▲ Name, ▲ Group' },
        { value: 'namedsc', text: '▼ Name, ▲ Group' },
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
    // etherscanAPIKey() {
    //   return store.getters['data/etherscanAPIKey'];
    // },
    // periodStart() {
    //   return store.getters['data/periodStart'];
    // },
    // periodOptions() {
    //   return store.getters['data/periodOptions'];
    // },
    filteredAccounts() {
      const results = [];
      const filterLower = this.settings.filter && this.settings.filter.toLowerCase() || null;
      for (const [key, data] of Object.entries(this.accounts)) {
        // const ensName = this.ensMap[address] || null;
        const [chainId, account] = key.split(':');
        let include = filterLower == null ||
          (account.toLowerCase().includes(filterLower)) ||
          (data.name && data.name.toLowerCase().includes(filterLower)) ||
          (data.group && data.group.toLowerCase().includes(filterLower)) ||
          (data.notes && data.notes.toLowerCase().includes(filterLower));
          // (ensName != null && ensName.toLowerCase().includes(searchAddressesLower)));
        if (include && this.settings.accountMineFilter != null) {
          if (this.settings.accountMineFilter == 'mine' && data.mine) {
          } else if (this.settings.accountMineFilter == 'notmine' && !data.mine) {
          } else {
            include = false;
          }
        }
        if (include && this.settings.accountTypeFilter != null) {
          if (this.settings.accountTypeFilter == 'unknown' && data.type == null) {
          } else if (this.settings.accountTypeFilter == data.type) {
          } else {
            include = false;
          }
        }
        if (include) {
          results.push({
            chainId,
            account,
            group: data.group,
            name: data.name,
            type: data.type,
            mine: data.mine,
            tags: data.tags,
            notes: data.notes,
            contract: data.contract,
          });
        }
      }
      return results;
    },
    filteredSortedAccounts() {
      const results = this.filteredAccounts;
      if (this.sortOption == 'accountasc') {
        results.sort((a, b) => {
          return ('' + a.account).localeCompare(b.account);
        });
      } else if (this.sortOption == 'accountdsc') {
        results.sort((a, b) => {
          return ('' + b.account).localeCompare(a.account);
        });
      } else if (this.sortOption == 'groupasc') {
        results.sort((a, b) => {
          if (('' + a.group).localeCompare(b.group) == 0) {
            if (('' + a.name).localeCompare(b.name) == 0) {
              return ('' + a.account).localeCompare(b.account);
            } else {
              return ('' + a.name).localeCompare(b.name);
            }
          } else {
            return ('' + a.group).localeCompare(b.group);
          }
        });
      } else if (this.sortOption == 'groupdsc') {
        results.sort((a, b) => {
          if (('' + a.group).localeCompare(b.group) == 0) {
            if (('' + a.name).localeCompare(b.name) == 0) {
              return ('' + a.account).localeCompare(b.account);
            } else {
              return ('' + a.name).localeCompare(b.name);
            }
          } else {
            return ('' + b.group).localeCompare(a.group);
          }
        });
      } else if (this.sortOption == 'nameasc') {
        results.sort((a, b) => {
          if (('' + a.name).localeCompare(b.name) == 0) {
            if (('' + a.group).localeCompare(b.group) == 0) {
              return ('' + a.account).localeCompare(b.account);
            } else {
              return ('' + a.group).localeCompare(b.group);
            }
          } else {
            return ('' + a.name).localeCompare(b.name);
          }
        });
      } else if (this.sortOption == 'namedsc') {
        results.sort((a, b) => {
          if (('' + a.name).localeCompare(b.name) == 0) {
            if (('' + a.group).localeCompare(b.group) == 0) {
              return ('' + a.account).localeCompare(b.account);
            } else {
              return ('' + a.group).localeCompare(b.group);
            }
          } else {
            return ('' + b.name).localeCompare(a.name);
          }
        });
      }
      return results;
    },
    pagedFilteredSortedAccounts() {
      return this.filteredSortedAccounts.slice((this.settings.currentPage - 1) * this.settings.pageSize, this.settings.currentPage * this.settings.pageSize);
    },
  },
  methods: {
    saveSettings() {
      console.log("saveSettings: TODO");
    },
    addNewAccounts() {
      store.dispatch('data/addNewAccounts', this.settings.newAccounts);
    },
    async timeoutCallback() {
      logDebug("Accounts", "timeoutCallback() count: " + this.count);
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
    logDebug("Accounts", "beforeDestroy()");
  },
  mounted() {
    logDebug("Accounts", "mounted() $route: " + JSON.stringify(this.$route.params));
    store.dispatch('data/restoreState');
    this.reschedule = true;
    logDebug("Accounts", "Calling timeoutCallback()");
    this.timeoutCallback();
  },
  destroyed() {
    this.reschedule = false;
  },
};

const accountsModule = {
  namespaced: true,
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {
  },
};
