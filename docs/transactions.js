const Transactions = {
  template: `
    <div class="mt-5 pt-3">
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
          <!--
          <div class="mt-0 pr-0">
            <b-button size="sm" :pressed.sync="settings.showNewAccounts" @click="saveSettings" variant="link" v-b-popover.hover.top="'Add new accounts'"><span v-if="settings.showNewAccounts"><b-icon-plus-square-fill shift-v="+1" font-scale="1.0"></b-icon-plus-square-fill></span><span v-else><b-icon-plus-square shift-v="+1" font-scale="1.0"></b-icon-plus-square></span></b-button>
          </div>
          <div class="mt-0 pr-1">
            <b-button size="sm" :pressed.sync="settings.editAccounts" @click="saveSettings" :variant="settings.editAccounts ? 'danger' : 'link'" v-b-popover.hover.top="settings.editAccounts ? 'End editing account attributes' : 'Edit account attributes'"><b-icon-pencil shift-v="+1" font-scale="1.0"></b-icon-pencil></b-button>
          </div>
          <div class="mt-0 flex-grow-1">
          </div>
          -->
          <div class="mt-0 pr-0">
            <b-button v-if="sync.section == null" size="sm" @click="syncIt({ sections: ['importFromEtherscan'] })" variant="link" v-b-popover.hover.top="'Import transactions from Etherscan for accounts to be synced'"><b-icon-cloud-download shift-v="+1" font-scale="1.2"></b-icon-cloud-download></b-button>
          </div>
          <div class="mt-0 pr-1">
            <b-button v-if="sync.section == null" size="sm" @click="syncIt({ sections: ['computeTxs'], parameters: ['blah'] })" variant="link" v-b-popover.hover.top="'Compute selected transactions'"><b-icon-arrow-clockwise shift-v="+1" font-scale="1.2"></b-icon-arrow-clockwise></b-button>
          </div>
          <div class="mt-1" style="width: 200px;">
            <b-progress v-if="sync.section != null" height="1.5rem" :max="sync.total" show-progress :animated="sync.section != null" :variant="sync.section != null ? 'success' : 'secondary'" v-b-popover.hover.top="'Click the button on the right to stop. This process can be continued later'">
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
            <font size="-2" v-b-popover.hover.top="'# transactions'">{{ filteredSortedTransactions.length + '/' + Object.keys(txs).length }}</font>
          </div>
          <div class="mt-0 pr-1">
            <b-pagination size="sm" v-model="settings.currentPage" @input="saveSettings" :total-rows="filteredSortedTransactions.length" :per-page="settings.pageSize" style="height: 0;"></b-pagination>
          </div>
          <div class="mt-0 pl-1">
            <b-form-select size="sm" v-model="settings.pageSize" @change="saveSettings" :options="pageSizes" v-b-popover.hover.top="'Page size'"></b-form-select>
          </div>
        </div>

        <b-card v-if="false && settings.showNewAccounts" no-body no-header bg-variant="light" class="m-1 p-1 w-75">
          <b-card-body class="m-1 p-1">
            <b-form-group label-cols-lg="2" label="New Accounts" label-size="md" label-class="font-weight-bold pt-0" class="mb-0">
              <b-form-group label="Accounts:" label-for="newaccounts-accounts" label-size="sm" label-cols-sm="2" label-align-sm="right" description="List of Ethereum accounts. These are saved in your local browser storage and are used to request information via your web3 connection, or via Etherscan and Reservoir API calls" class="mx-0 my-1 p-0">
                <b-form-textarea size="sm" id="newaccounts-accounts" v-model.trim="settings.newAccounts" rows="1" max-rows="5" placeholder="0x1234... 0x2345..., 0xAbCd..."></b-form-textarea>
              </b-form-group>
              <b-form-group label="" label-for="newaccounts-submit" label-size="sm" label-cols-sm="2" label-align-sm="right" description="Only valid accounts will be added below" class="mx-0 my-1 p-0">
                <b-button size="sm" id="newaccounts-submit" :disabled="settings.newAccounts == null || settings.newAccounts.length == 0" @click="addNewAccounts" variant="primary">Add</b-button>
              </b-form-group>
              <b-form-group label="Coinbase:" label-for="newaccounts-coinbase-submit" label-size="sm" label-cols-sm="2" label-align-sm="right" class="mx-0 my-1 p-0">
                <b-button size="sm" id="newaccounts-coinbase-submit" :disabled="coinbaseIncluded" @click="addCoinbase" variant="primary">{{ (coinbaseIncluded ? 'Already added ' : 'Add ') + coinbase }}</b-button>
              </b-form-group>
            </b-form-group>
          </b-card-body>
        </b-card>

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

        <b-table v-if="false" small fixed striped responsive hover :fields="accountsFields" :items="pagedFilteredSortedAccounts" show-empty empty-html="Click [+] above to add accounts" head-variant="light" class="m-0 mt-1">
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
            <b-link class="sm" :id="'popover-target-' + data.item.account">
              {{ data.item.account }}
            </b-link>
            <br />
            <font size="-1">
              <div class="d-flex flex-row">
                <div class="m-0 pt-1 pr-1">
                  <span v-if="settings.editAccounts">
                    <b-form-select size="sm" v-model="data.item.type" @change="setAccountType(data.item.key, $event)" :options="accountTypes" v-b-popover.hover.top="'Select type'"></b-form-select>
                  </span>
                  <span v-if="!settings.editAccounts">
                    <b-badge variant="info" v-b-popover.hover="'Account type'">{{ data.item.type }}</b-badge>
                  </span>
                </div>
                <div v-if="data.item.mine || settings.editAccounts" class="m-0 pt-1 pr-1">
                  <span v-if="settings.editAccounts">
                    <b-form-checkbox size="sm" :checked="data.item.mine ? 1 : 0" value="1" @change="toggleAccountMine(data.item.key)" v-b-popover.hover="'My account?'">Mine</b-form-checkbox>
                  </span>
                  <span v-if="!settings.editAccounts">
                    <b-badge v-if="data.item.mine" variant="primary" v-b-popover.hover="'My account'">Mine</b-badge>
                  </span>
                </div>
                <div v-if="data.item.sync || settings.editAccounts" class="m-0 pt-1 pr-1">
                  <span v-if="settings.editAccounts">
                    <b-form-checkbox size="sm" :checked="data.item.sync ? 1 : 0" value="1" @change="toggleAccountSync(data.item.key)" v-b-popover.hover="'Include in update process?'">Sync</b-form-checkbox>
                  </span>
                  <span v-if="!settings.editAccounts">
                    <b-badge v-if="data.item.sync" variant="primary" v-b-popover.hover="'Will be included in the update process'">Sync</b-badge>
                  </span>
                </div>
                <div class="m-0 pt-1 pr-1">
                  <span v-if="data.item.type != 'erc721'">
                    <b-badge v-if="hasENS(data.item.account)" variant="secondary" v-b-popover.hover="'ENS name if set'">{{ ensOrNull(data.item.account) }}</b-badge>
                  </span>
                  <span v-if="data.item.type == 'erc721'">
                    <b-badge variant="secondary" v-b-popover.hover="'ERC-721 collection name'">{{ data.item.collection.name }}</b-badge>
                  </span>
                </div>
                <div class="m-0 pt-1 pr-1">
                  <span v-if="settings.editAccounts">
                    <b-form-input type="text" size="sm" v-model.trim="data.item.group" @change="setGroup(data.item.key, data.item.group)" debounce="600" placeholder="group"></b-form-input>
                  </span>
                  <span v-if="!settings.editAccounts">
                    <b-badge v-if="data.item.group && data.item.group.length > 0" variant="dark" v-b-popover.hover="'Group'">{{ data.item.group }}</b-badge>
                  </span>
                </div>
              </div>
            </font>
            <b-popover :target="'popover-target-' + data.item.account" placement="right" custom-class="popover-max-width">
              <template #title>
                <span v-if="data.item.type != 'erc721'">
                  {{ ensOrAccount(data.item.account) }}
                </span>
                <span v-if="data.item.type == 'erc721'">
                  {{ data.item.collection.name }}
                </span>
              </template>
              <span v-if="data.item.type != 'erc721'">
                <b-link @click="copyToClipboard(data.item.account);">Copy account to clipboard</b-link>
                <br />
                <span v-if="ensOrNull(data.item.account) != null && ensOrNull(data.item.account).length > 0">
                  <b-link @click="copyToClipboard(ensOrNull(data.item.account));">Copy ENS name to clipboard</b-link>
                  <br />
                  <b-link :href="'https://app.ens.domains/name/' + ensOrNull(data.item.account)" target="_blank">View ENS name in app.ens.domains</b-link>
                  <br />
                </span>
                <b-link :href="'https://etherscan.io/address/' + data.item.account" target="_blank">View account in etherscan.io</b-link>
                <br />
                <b-link :href="'https://opensea.io/' + data.item.account" target="_blank">View account in opensea.io</b-link>
                <br />
                <b-link :href="'https://opensea.io/' + data.item.account + '?tab=bids'" target="_blank">View offers received in opensea.io</b-link>
                <br />
                <b-link :href="'https://looksrare.org/accounts/' + data.item.account + '#owned'" target="_blank">View account in looksrare.org</b-link>
                <br />
                <b-link :href="'https://x2y2.io/user/' + data.item.account + '/items'" target="_blank">View account in x2y2.io</b-link>
                <br />
                <b-link :href="'https://www.gem.xyz/profile/' + data.item.account" target="_blank">View account in gem.xyz</b-link>
                <br />
                <b-link :href="'https://blur.io/' + data.item.account" target="_blank">View account in blur.io</b-link>
                <br />
              </span>
              <span v-if="data.item.type == 'erc721'">
                <b-link @click="copyToClipboard(data.item.account);">Copy ERC-721 NFT collection address to clipboard</b-link>
                <br />
                <b-link :href="'https://etherscan.io/token/' + data.item.account + '#balances'" target="_blank">View ERC-721 NFT collection in etherscan.io</b-link>
                <br />
                <b-link :href="'https://opensea.io/collection/' + data.item.collection.slug" target="_blank">View ERC-721 NFT collection in opensea.io</b-link>
                <br />
                <b-link :href="'https://looksrare.org/collections/' + data.item.account" target="_blank">View ERC-721 NFT collection in looksrare.org</b-link>
                <br />
                <b-link :href="'https://x2y2.io/collection/' + data.item.collection.slug + '/items'" target="_blank">View ERC-721 NFT collection in x2y2.io</b-link>
                <br />
                <b-link :href="'https://www.gem.xyz/collection/' + data.item.collection.slug" target="_blank">View ERC-721 NFT collection in gem.xyz</b-link>
                <br />
                <b-link :href="'https://blur.io/collection/' + data.item.collection.slug" target="_blank">View ERC-721 NFT collection in blur.io</b-link>
                <br />
              </span>
            </b-popover>
          </template>
          <template #cell(name)="data">
            <!--
            <font size="-1">
              <b-badge variant="secondary">{{ data.item.group }}</b-badge>
            </font>
            -->
            <span v-if="settings.editAccounts">
              <b-form-input type="text" size="sm" v-model.trim="data.item.name" @change="setName(data.item.key, data.item.name)" debounce="600" placeholder="name"></b-form-input>
              <b-form-textarea size="sm" v-model.trim="data.item.notes" @change="setNotes(data.item.key, data.item.notes)" placeholder="notes" rows="2" max-rows="20" class="mt-1"></b-form-textarea>
            </span>
            <span v-if="!settings.editAccounts">
              {{ data.item.name }}
              <br />
              <font size="-1">
                {{ data.item.notes }}
              </font>
            </span>
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
        txhashFilter: null,
        accountFilter: null,
        accountTypeFilter: null,
        accountMineFilter: null,
        showNewAccounts: false,
        editAccounts: false,
        newAccounts: null,
        period: null,
        selectedAccounts: {}, // TODO: delete
        selectedTransactions: {},
        currentPage: 1,
        pageSize: 100,
        sortOption: 'timestampdsc',
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
      accountsFields: [
        { key: 'number', label: '#', sortable: false, thStyle: 'width: 5%;', tdClass: 'text-truncate' },
        { key: 'image', label: '', sortable: false, thStyle: 'width: 5%;', thClass: 'text-right', tdClass: 'text-right' },
        { key: 'account', label: 'Account', sortable: false, thStyle: 'width: 35%;', tdClass: 'text-truncate' },
        // { key: 'type', label: 'Type', sortable: false, thStyle: 'width: 10%;', tdClass: 'text-truncate' },
        // { key: 'mine', label: 'Mine', sortable: false, thStyle: 'width: 10%;', tdClass: 'text-truncate' },
        // { key: 'ens', label: 'ENS', sortable: false, thStyle: 'width: 10%;', tdClass: 'text-truncate' },
        // { key: 'group', label: 'Group', sortable: false, thStyle: 'width: 10%;', tdClass: 'text-truncate' },
        { key: 'name', label: 'Name', sortable: false, thStyle: 'width: 45%;', tdClass: 'text-truncate' },
        // { key: 'notes', label: 'Notes', sortable: false, thStyle: 'width: 30%;', tdClass: 'text-truncate' },
        { key: 'end', label: 'Info', sortable: false, thStyle: 'width: 10%;', thClass: 'text-right', tdClass: 'text-right' },
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
    periodOptions() {
      const results = [];
      results.push({ value: null, text: "(select period)", data: null });
      for (const i of store.getters['config/periodOptions']) {
        results.push(i);
      }
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
    filteredTransactions() {
      const results = [];
      let startPeriod = null;
      let endPeriod = null;
      const txhashFilterLower = this.settings.txhashFilter && this.settings.txhashFilter.toLowerCase() || null;
      const accountFilterLower = this.settings.accountFilter && this.settings.accountFilter.toLowerCase() || null;
      if (this.settings.period != null && this.settings.period != "nodata") {
        const periodRecords = this.periodOptions.filter(e => e.value == this.settings.period);
        startPeriod = periodRecords[0].data.startPeriod;
        endPeriod = periodRecords[0].data.endPeriod;
      }
      for (const [txHash, item] of Object.entries(this.txs)) {
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
          const fromENS = this.ensMap[item.from] || null;
          if (
            !(item.from.toLowerCase().includes(accountFilterLower)) &&
            !(item.to.toLowerCase().includes(accountFilterLower)) &&
            !(fromENS != null && fromENS.toLowerCase().includes(accountFilterLower))
          ) {
            include = false;
          }
        }
        if (include) {
          results.push({
            txHash,
            blockNumber: item.blockNumber,
            transactionIndex: item.transactionIndex,
            timestamp: item.timestamp,
            from: item.from,
            to: item.to,
            value: item.value,
            info: item.computed.info && item.computed.info.summary || null,
          });
        }
      }
      // Vue.set(state.txs, result.hash, {
      //   blockNumber: result.blockNumber,
      //   timestamp: result.timeStamp,
      //   nonce: result.nonce,
      //   blockHash: result.blockHash,
      //   transactionIndex: result.transactionIndex,
      //   from: result.from,
      //   to: result.to,
      //   value: result.value,
      //   gas: result.gas,
      //   gasPrice: result.gasPrice,
      //   isError: result.isError,
      //   txReceiptStatus: result.txreceipt_status,
      //   input: result.input,
      //   contractAddress: result.contractAddress,
      //   cumulativeGasUsed: result.cumulativeGasUsed,
      //   gasUsed: result.gasUsed,
      //   confirmations: result.confirmations,
      //   methodId: result.methodId,
      //   functionName: result.functionName,
      //   etherscanImported: {
      //     account,
      //     timestamp: block && block.timestamp || null,
      //     blockNumber: block && block.number || null,
      //   },
      //   dataImported: {
      //     tx: null,
      //     txReceipt: null,
      //     balances: {},
      //     balancePreviousBlock: {},
      //     timestamp: null,
      //     blockNumber: null,
      //   },
      //   computed: {
      //     info: {},
      //     timestamp: null,
      //     blockNumber: null,
      //   },
      // });
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
    filteredAccounts() {
      const results = [];
      const filterLower = this.settings.filter && this.settings.filter.toLowerCase() || null;
      for (const [key, data] of Object.entries(this.accounts)) {
        const [chainId, account] = key.split(':');
        const ensName = this.ensMap[account] || null;
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
            key,
            chainId,
            account,
            group: data.group,
            name: data.name,
            type: data.type,
            mine: data.mine,
            sync: data.sync,
            tags: data.tags,
            notes: data.notes,
            contract: data.contract,
            collection: data.collection,
            balances: data.balances,
            created: data.created,
            updated: data.updated,
          });
        }
      }
      // console.log("filteredAccounts: " + JSON.stringify(results, null, 2));
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
      localStorage.transactionsSettings = JSON.stringify(this.settings);
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
    // TODO: Delete
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
      this.saveSettings();
    },
    // TODO: Delete
    clearSelectedAccounts() {
      this.settings.selectedAccounts = {};
      this.saveSettings();
    },
    async toggleAccountMine(key) {
      store.dispatch('data/toggleAccountMine', key);
    },
    async toggleAccountSync(key) {
      store.dispatch('data/toggleAccountSync', key);
    },
    async setAccountType(key, accountType) {
      store.dispatch('data/setAccountType', { key, accountType });
    },
    async setGroup(key, group) {
      store.dispatch('data/setGroup', { key, group });
    },
    async setName(key, name) {
      store.dispatch('data/setName', { key, name });
    },
    async setNotes(key, notes) {
      store.dispatch('data/setNotes', { key, notes });
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
    async timeoutCallback() {
      logDebug("Transactions", "timeoutCallback() count: " + this.count);
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
    logDebug("Transactions", "beforeDestroy()");
  },
  mounted() {
    logDebug("Transactions", "mounted() $route: " + JSON.stringify(this.$route.params));
    store.dispatch('data/restoreState');
    if ('transactionsSettings' in localStorage) {
      this.settings = JSON.parse(localStorage.transactionsSettings);
    }
    this.reschedule = true;
    logDebug("Transactions", "Calling timeoutCallback()");
    this.timeoutCallback();
  },
  destroyed() {
    this.reschedule = false;
  },
};

const transactionsModule = {
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
