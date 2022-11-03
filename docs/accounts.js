const Accounts = {
  template: `
    <div class="mt-5 pt-3">
      <b-card no-body no-header class="border-0">

        <div class="d-flex flex-wrap m-0 p-0">
          <div class="mt-0 pr-1">
            <b-form-input type="text" size="sm" v-model.trim="settings.filter" @change="saveSettings" debounce="600" v-b-popover.hover.top="'Filter by address or ENS name fragment'" placeholder="🔍 address / ens name"></b-form-input>
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
              <b-form-group label="Accounts:" label-for="newaccounts-accounts" label-size="sm" label-cols-sm="2" label-align-sm="right" description="List of Ethereum accounts. These are saved in your local browser storage and are used to request information via your web3 connection, or via Etherscan and Reservoir API calls" class="mx-0 my-1 p-0">
                <b-form-textarea size="sm" id="newaccounts-accounts" v-model.trim="settings.newAccounts" rows="1" max-rows="5" placeholder="0x1234... 0x2345..., 0xAbCd..."></b-form-textarea>
              </b-form-group>
              <b-form-group label="" label-for="newaccounts-submit" label-size="sm" label-cols-sm="2" label-align-sm="right" description="Only valid accounts will be added below" class="mx-0 my-1 p-0">
                <b-button size="sm" id="newaccounts-submit" :disabled="settings.newAccounts == null || settings.newAccounts.length == 0" @click="addNewAccounts" variant="primary">Add</b-button>
              </b-form-group>
            </b-form-group>
          </b-card-body>
        </b-card>

        <b-table small fixed striped responsive hover :fields="accountsFields" :items="pagedFilteredSortedAccounts" show-empty empty-html="Click [+] above to add accounts" head-variant="light" class="m-0 mt-1">
          <template #head(number)="data">
            <b-dropdown size="sm" variant="link" v-b-popover.hover="'Toggle selection'">
              <template #button-content>
                <b-icon-check-square shift-v="+1" font-scale="0.9"></b-icon-check-square>
              </template>
              <b-dropdown-item href="#" @click="toggleSelectedAccounts(pagedFilteredSortedAccounts)">Toggle selection for all accounts on this page</b-dropdown-item>
              <b-dropdown-item href="#" @click="toggleSelectedAccounts(filteredSortedAccounts)">Toggle selection for all accounts on all pages</b-dropdown-item>
              <b-dropdown-item href="#" @click="clearSelectedAccounts()">Clear selection</b-dropdown-item>
            </b-dropdown>
          </template>
          <template #cell(number)="data">
            <b-form-checkbox size="sm" :checked="settings.selectedAccounts[data.item.account] ? 1 : 0" value="1" @change="toggleSelectedAccounts([data.item])">
              {{ parseInt(data.index) + ((settings.currentPage - 1) * settings.pageSize) + 1 }}
            </b-form-checkbox>
          </template>
          <template #cell(image)="data">
            <div v-if="data.item.type == 'erc721'">
              <b-avatar rounded variant="light" size="3.0rem" :src="data.item.collection.image" v-b-popover.hover="'ERC-721 collection'"></b-avatar>
            </div>
            <div v-else-if="data.item.type == 'eoa' && data.item.account != ensOrAccount(data.item.account)">
              <b-avatar rounded variant="light" size="3.0rem" :src="'https://metadata.ens.domains/mainnet/avatar/' + ensOrAccount(data.item.account)" v-b-popover.hover="'ENS avatar if set'"></b-avatar>
            </div>
          </template>
          <template #cell(account)="data">
            <b-button class="sm" :id="'popover-target-' + data.item.account" variant="link" class="m-0 p-0">
              {{ data.item.account }}
            </b-button>
            <br />
            {{ ensOrNull(data.item.account) }}
            <br />
            <b-popover :target="'popover-target-' + data.item.account" placement="right" custom-class="popover-max-width">
              <template #title>{{ ensOrAccount(data.item.account) }}</template>
            </b-popover>
          </template>
        </b-table>

        <!--
        <br />
        <b-table small fixed striped selectable responsive hover :items="pagedFilteredSortedAccounts" show-empty empty-html="Click [+] above to add accounts" head-variant="light" class="m-0 mt-1">
        </b-table>
        -->

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
        selectedAccounts: {},
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
      accountsFields: [
        { key: 'number', label: '#', sortable: false, thStyle: 'width: 5%;', tdClass: 'text-truncate' },
        { key: 'image', label: '', sortable: false, thStyle: 'width: 5%;', thClass: 'text-right', tdClass: 'text-right' },
        { key: 'account', label: 'Account', sortable: false, thStyle: 'width: 50%;', tdClass: 'text-truncate' },
        // { key: 'type', label: 'Type', sortable: false, thStyle: 'width: 10%;', tdClass: 'text-truncate' },
        // { key: 'mine', label: 'Mine', sortable: false, thStyle: 'width: 10%;', tdClass: 'text-truncate' },
        // { key: 'ens', label: 'ENS', sortable: false, thStyle: 'width: 10%;', tdClass: 'text-truncate' },
        { key: 'group', label: 'Group', sortable: false, thStyle: 'width: 10%;', tdClass: 'text-truncate' },
        { key: 'name', label: 'Name', sortable: false, thStyle: 'width: 15%;', tdClass: 'text-truncate' },
        { key: 'notes', label: 'Notes', sortable: false, thStyle: 'width: 10%;', tdClass: 'text-truncate' },
        // { key: 'end', label: '', sortable: false, thStyle: 'width: 10%;', thClass: 'text-right', tdClass: 'text-right' },
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
    filteredAccounts() {
      const results = [];
      const filterLower = this.settings.filter && this.settings.filter.toLowerCase() || null;
      for (const [key, data] of Object.entries(this.accounts)) {
        const [chainId, account] = key.split(':');
        const ensName = this.ensMap[account] || null;
        console.log(account + " => " + ensName);
        let include = filterLower == null ||
          (account.toLowerCase().includes(filterLower)) ||
          (data.name && data.name.toLowerCase().includes(filterLower)) ||
          (data.group && data.group.toLowerCase().includes(filterLower)) ||
          (data.notes && data.notes.toLowerCase().includes(filterLower)) ||
          (ensName != null && ensName.toLowerCase().includes(filterLower));
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
            collection: data.collection,
            created: data.created,
            updated: data.updated,
          });
        }
      }
      console.log("filteredAccounts: " + JSON.stringify(results, null, 2));
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
    toggleSelectedAccounts(items) {
      let someFalse = false;
      let someTrue = false;
      for (const item of items) {
        if (this.settings.selectedAccounts[item.account]) {
          someTrue = true;
        } else {
          someFalse = true;
        }
      }
      for (const item of items) {
        if (!(someTrue && !someFalse)) {
          Vue.set(this.settings.selectedAccounts, item.account, true);
        } else {
          Vue.delete(this.settings.selectedAccounts, item.account);
        }
      }
      console.log("toggleSelectedAccounts: " + JSON.stringify(this.settings.selectedAccounts));
      // localStorage.selectedAccounts = JSON.stringify(this.settings.selectedAccounts);
    },
    clearSelectedAccounts() {
      this.settings.selectedAccounts = {};
      // localStorage.selectedAccounts = JSON.stringify(this.settings.selectedAccounts);
    },
    ensOrAccount(account, length = 0) {
      let result = null;
      if (this.ensMap && (account in this.ensMap)) {
        result = this.ensMap[account];
      }
      if (result == null || result.length == 0) {
        result = account;
      }
      return result == null ? null : (length == 0 ? result : result.substring(0, length));
    },
    ensOrNull(account, length = 0) {
      let result = null;
      if (this.ensMap && (account in this.ensMap)) {
        result = this.ensMap[account];
      } else {
        result = account;
      }
      return result == null ? null : (length == 0 ? result : result.substring(0, length));
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
