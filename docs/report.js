const Report = {
  template: `
    <div class="m-0 p-0">
      <b-card no-body no-header class="border-0">

        <b-modal id="modal-account" hide-footer size="md">
          <template #modal-title>
            <font size="-1">{{ ensOrAccount(modalAddress) }}</font>
          </template>
          <b-link @click="copyToClipboard(modalAddress);">Copy account to clipboard</b-link>
          <br />
          <span v-if="ensOrNull(modalAddress) != null && ensOrNull(modalAddress).length > 0">
            <b-link @click="copyToClipboard(ensOrNull(modalAddress));">Copy ENS name to clipboard</b-link>
            <br />
            <b-link :href="'https://app.ens.domains/name/' + ensOrNull(modalAddress)" target="_blank">View ENS name in app.ens.domains</b-link>
            <br />
            <b-link :href="'https://etherscan.io/enslookup-search?search=' + ensOrNull(modalAddress)" target="_blank">View ENS name in etherscan.io</b-link>
            <br />
          </span>
          <b-link :href="'https://etherscan.io/address/' + modalAddress" target="_blank">View account in etherscan.io</b-link>
          <br />
          <b-link :href="'https://opensea.io/' + modalAddress + '/'" target="_blank">View account in opensea.io</b-link>
          <br />
          <b-link :href="'https://looksrare.org/accounts/' + modalAddress + '#owned'" target="_blank">View account in looksrare.org</b-link>
          <br />
          <b-link :href="'https://x2y2.io/user/' + modalAddress + '/items'" target="_blank">View account in x2y2.io</b-link>
        </b-modal>

        <b-modal id="modal-tx" hide-footer size="lg">
          <template #modal-title>
            <font size="-1">{{ modalTx.hash }}</font>
            <b-button size="sm" @click="copyToClipboard(modalTx.hash);" variant="link" class="m-0 p-0" v-b-popover.hover.top="'Copy to clipboard'"><b-icon-clipboard shift-v="+1" font-scale="1.1"></b-icon-clipboard></b-button>
            <b-button size="sm" :href="'https://etherscan.io/tx/' + modalTx.hash" target="_blank" variant="link" class="m-0 p-0" v-b-popover.hover.top="'View in etherscan.io'">
              <b-img rounded="0" width="16px" height="16px" src="images/etherscan-logo-circle.svg" blank-color="#777" target="_blank"></b-img>
            </b-button>
          </template>
          <b-form-group label="Tx hash:" label-for="modaltx-txhash" label-size="sm" label-cols-sm="2" label-align-sm="right" class="mx-0 my-1 p-0">
            <b-form-input type="text" readonly size="sm" id="modaltx-txhash" :value="modalTx.hash" class="w-100"></b-form-input>
          </b-form-group>
          <b-form-group v-if="modalTx.txReceipt" label="Block:" label-for="modaltx-blocknumber" label-size="sm" label-cols-sm="2" label-align-sm="right" class="mx-0 my-1 p-0">
            <b-form-input type="text" readonly size="sm" id="modaltx-blocknumber" :value="modalTx.txReceipt.blockNumber" class="w-50"></b-form-input>
          </b-form-group>
          <b-form-group v-if="modalTx.timestamp" label="Timestamp:" label-for="modaltx-timestamp" label-size="sm" label-cols-sm="2" label-align-sm="right" class="mx-0 my-1 p-0">
            <b-form-input type="text" readonly size="sm" id="modaltx-timestamp" :value="formatTimestamp(modalTx.timestamp)" class="w-50"></b-form-input>
          </b-form-group>
          <b-form-group v-if="modalTx.tx" label="From:" label-for="modaltx-from" label-size="sm" label-cols-sm="2" label-align-sm="right" class="mx-0 my-1 p-0">
            <b-form-input type="text" readonly size="sm" id="modaltx-from" :value="modalTx.tx.from" class="w-75"></b-form-input>
          </b-form-group>
          <b-form-group v-if="modalTx.tx" label="To:" label-for="modaltx-to" label-size="sm" label-cols-sm="2" label-align-sm="right" class="mx-0 my-1 p-0">
            <b-form-input type="text" readonly size="sm" id="modaltx-to" :value="modalTx.tx.to && modalTx.tx.to.length > 2 && modalTx.tx.to || 'Contract Deployment'" class="w-75"></b-form-input>
          </b-form-group>
          <b-form-group v-if="modalTx.functionCall" label="Function Call:" label-for="modaltx-functioncall" label-size="sm" label-cols-sm="2" label-align-sm="right" class="mx-0 my-1 p-0">
            <b-form-input type="text" readonly size="sm" id="modaltx-functioncall" :value="modalTx.functionCall" class="w-75"></b-form-input>
          </b-form-group>
          <b-form-group v-if="modalTx.tx" label="Value:" label-for="modaltx-value" label-size="sm" label-cols-sm="2" label-align-sm="right" class="mx-0 my-1 p-0">
            <b-form-input type="text" readonly size="sm" id="modaltx-value" :value="formatETH(modalTx.tx.value, 18)" class="w-50"></b-form-input>
          </b-form-group>
          <b-form-group v-if="modalTx.txReceipt" label="Gas Used:" label-for="modaltx-gasused" label-size="sm" label-cols-sm="2" label-align-sm="right" class="mx-0 my-1 p-0">
            <b-form-input type="text" readonly size="sm" id="modaltx-gasused" :value="formatNumber(modalTx.txReceipt.gasUsed)" class="w-50"></b-form-input>
          </b-form-group>
          <b-form-group v-if="modalTx.txReceipt" label="Gas Price (gwei):" label-for="modaltx-gasprice" label-size="sm" label-cols-sm="2" label-align-sm="right" class="mx-0 my-1 p-0">
            <b-form-input type="text" readonly size="sm" id="modaltx-gasprice" :value="formatGwei(modalTx.txReceipt.effectiveGasPrice)" class="w-50"></b-form-input>
          </b-form-group>
          <b-form-group v-if="modalTx.txReceipt" label="Tx Fee (Ξ):" label-for="modaltx-txfee" label-size="sm" label-cols-sm="2" label-align-sm="right" class="mx-0 my-1 p-0">
            <b-form-input type="text" readonly size="sm" id="modaltx-txfee" :value="formatETH(modalTx.txFee)" class="w-50"></b-form-input>
          </b-form-group>
        </b-modal>

        <b-modal id="modal-nft-collection" hide-footer size="lg">
          <template #modal-title>
            <font size="-1">NFT Collection {{ modalNFTCollection.nftCollection }}</font>
            <b-button size="sm" :href="'https://etherscan.io/token/' + modalNFTCollection.nftCollection + '#balances'" target="_blank" variant="link" class="m-0 p-0" v-b-popover.hover.top="'View in etherscan.io'">
              <b-img rounded="0" width="16px" height="16px" src="images/etherscan-logo-circle.svg" blank-color="#777" target="_blank"></b-img>
            </b-button>
            <!--
            <b-button size="sm" @click="copyToClipboard(modalTx.hash);" variant="link" class="m-0 p-0" v-b-popover.hover.top="'Copy to clipboard'"><b-icon-clipboard shift-v="+1" font-scale="1.1"></b-icon-clipboard></b-button>
            <b-button size="sm" :href="'https://opensea.io/assets/ethereum/' + modalNFT.nftEvent.contract + '/' + modalNFT.nftEvent.tokenId" target="_blank" variant="link" class="m-0 p-0" v-b-popover.hover.top="'View in etherscan.io'">
              <b-img rounded="0" width="16px" height="16px" src="images/OpenSea-Logomark-Blue.svg" blank-color="#777" target="_blank"></b-img>
            </b-button>
            -->
          </template>
            <p>{{ modalNFTCollection.nftCollection }}</p>
        </b-modal>

        <b-modal id="modal-nft" hide-footer size="lg">
          <template #modal-title>
            <font size="-1">NFT {{ modalNFT.nftEvent.contract + ':' + modalNFT.nftEvent.tokenId }}</font>
            <!--
            <b-button size="sm" @click="copyToClipboard(modalTx.hash);" variant="link" class="m-0 p-0" v-b-popover.hover.top="'Copy to clipboard'"><b-icon-clipboard shift-v="+1" font-scale="1.1"></b-icon-clipboard></b-button>
            -->
            <b-button size="sm" :href="'https://opensea.io/assets/ethereum/' + modalNFT.nftEvent.contract + '/' + modalNFT.nftEvent.tokenId" target="_blank" variant="link" class="m-0 p-0" v-b-popover.hover.top="'View in etherscan.io'">
              <b-img rounded="0" width="16px" height="16px" src="images/OpenSea-Logomark-Blue.svg" blank-color="#777" target="_blank"></b-img>
            </b-button>
          </template>
            <p>{{ modalNFT.nftEvent }}</p>
        </b-modal>

        <b-modal id="modal-ens" hide-footer size="lg">
          <template #modal-title>
            <font size="-1">ENS {{ modalENS.ensEvent.name + '.eth' }}</font>
            <!--
            <b-button size="sm" @click="copyToClipboard(modalTx.hash);" variant="link" class="m-0 p-0" v-b-popover.hover.top="'Copy to clipboard'"><b-icon-clipboard shift-v="+1" font-scale="1.1"></b-icon-clipboard></b-button>
            -->
            <b-button size="sm" :href="'https://opensea.io/assets/ethereum/' + modalENS.ensEvent.contract + '/' + modalENS.ensEvent.tokenId" target="_blank" variant="link" class="m-0 p-0" v-b-popover.hover.top="'View in opensea.io'">
              <b-img rounded="0" width="16px" height="16px" src="images/OpenSea-Logomark-Blue.svg" blank-color="#777" target="_blank"></b-img>
            </b-button>
          </template>
          <p>{{ modalENS }}</p>
        </b-modal>

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
          <div class="mt-0 pr-1">
            <b-button size="sm" :pressed.sync="settings.showAdditionalFilters" @click="saveSettings" variant="link" v-b-popover.hover.top="'Additional filters'"><span v-if="settings.showAdditionalFilters"><b-icon-funnel-fill shift-v="+1" font-scale="1.0"></b-icon-funnel-fill></span><span v-else><b-icon-funnel shift-v="+1" font-scale="1.0"></b-icon-funnel></span></b-button>
          </div>
          <div v-if="Object.keys(settings.filters).length > 0" class="mt-0 pr-1">
            <b-button size="sm" @click="resetAdditionalFilters();" variant="link" class="m-0 p-0" v-b-popover.hover.top="'Reset additional filters'">
              <b-iconstack shift-v="-1" font-scale="1">
                <b-icon stacked icon="funnel-fill" variant="info" scale="1"></b-icon>
                <b-icon stacked icon="x" variant="danger" scale="1.3"></b-icon>
              </b-iconstack>
            </b-button>
          </div>
          <div class="mt-0 flex-grow-1">
          </div>
          <div v-if="sync.section == null" class="mt-0 pr-1">
            <b-button size="sm" :disabled="block == null" @click="syncIt({ sections: ['importFromEtherscan', 'downloadData', 'buildAssets', 'getExchangeRates'], parameters: [] })" variant="link" v-b-popover.hover.top="'Import Etherscan transactions and web3 transfer events for accounts configured to be synced'"><b-icon-cloud-download shift-v="+1" font-scale="1.2"></b-icon-cloud-download></b-button>
          </div>
          <!--
          <div v-if="sync.section == null" class="mt-0 pr-1">
            <b-button size="sm" :disabled="block == null" @click="syncIt({ sections: ['downloadData'], parameters: Object.keys(settings.selectedAccounts) })" variant="link" v-b-popover.hover.top="'Import transaction data via web3 for accounts configured to be synced'"><b-icon-cloud shift-v="+1" font-scale="1.2"></b-icon-cloud></b-button>
          </div>
          -->
          <!--
          <div v-if="sync.section == null" class="mt-0 pr-1">
            <b-button size="sm" :disabled="block == null" @click="syncIt({ sections: ['getExchangeRates'], parameters: [] })" variant="link" v-b-popover.hover.top="'Get exchange rates'"><b-icon-bar-chart shift-v="+1" font-scale="1.2"></b-icon-bar-chart></b-button>
          </div>
          -->
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

        <div v-if="settings.showAdditionalFilters" class="d-flex flex-wrap m-0 p-0">
          <div class="mt-0 pr-1" style="width: 15.0rem;">
            <b-card no-header no-body class="m-0 mt-1 p-0 border-1">
              <b-card-body class="m-0 p-0">
                <font size="-2">
                  <b-table small fixed striped sticky-header="200px" :fields="accountsFilterFields" :items="getAllAccounts" head-variant="light">
                    <template #cell(select)="data">
                      <b-form-checkbox size="sm" :checked="(settings.filters['accounts'] && settings.filters['accounts'][data.item.account]) ? 1 : 0" value="1" @change="filterChanged('accounts', data.item.account)"></b-form-checkbox>
                    </template>
                    <template #cell(account)="data">
                      {{ ensOrAccount(data.item.account, 20) }}
                    </template>
                  </b-table>
                </font>
              </b-card-body>
            </b-card>
          </div>

          <div class="mt-0 pr-1" style="width: 15.0rem;">
            <b-card no-header no-body class="m-0 mt-1 p-0 border-1">
              <b-card-body class="m-0 p-0">
                <font size="-2">
                  <b-table small fixed striped sticky-header="200px" :fields="typesFilterFields" :items="getAllTypes" head-variant="light">
                    <template #cell(select)="data">
                      <b-form-checkbox size="sm" :checked="(settings.filters['types'] && settings.filters['types'][data.item.type]) ? 1 : 0" value="1" @change="filterChanged('types', data.item.type)"></b-form-checkbox>
                    </template>
                  </b-table>
                </font>
              </b-card-body>
            </b-card>
          </div>
          <div class="mt-0 pr-1" style="width: 15.0rem;">
            <b-card no-header no-body class="m-0 mt-1 p-0 border-1">
              <b-card-body class="m-0 p-0">
                <font size="-2">
                  <b-table small fixed striped sticky-header="200px" :fields="actionsFilterFields" :items="getAllActions" head-variant="light">
                    <template #cell(select)="data">
                      <b-form-checkbox size="sm" :checked="(settings.filters['actions'] && settings.filters['actions'][data.item.action]) ? 1 : 0" value="1" @change="filterChanged('actions', data.item.action)"></b-form-checkbox>
                    </template>
                  </b-table>
                </font>
              </b-card-body>
            </b-card>
          </div>
          <div class="mt-0 pr-1" style="width: 30.0rem;">
            <b-card no-header no-body class="m-0 mt-1 p-0 border-1">
              <b-card-body class="m-0 p-0">
                <font size="-2">
                  <b-table small fixed striped sticky-header="200px" :fields="functionCallsFilterFields" :items="getAllFunctionCalls" head-variant="light">
                    <template #cell(select)="data">
                      <b-form-checkbox size="sm" :checked="(settings.filters['functionCalls'] && settings.filters['functionCalls'][data.item.functionCall]) ? 1 : 0" value="1" @change="filterChanged('functionCalls', data.item.functionCall)"></b-form-checkbox>
                    </template>
                  </b-table>
                </font>
              </b-card-body>
            </b-card>
          </div>
        </div>

        <b-table small fixed striped responsive hover :fields="transactionsFields" :items="pagedFilteredSortedTransactions" show-empty empty-html="Add accounts, sync, then generate report" head-variant="light" class="m-0 mt-1">
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
            <b-link @click="showModalTx(data.item.txHash);">{{ formatTimestamp(data.item.timestamp) }}</b-link>
            <br />
            <font size="-2">
              {{ data.item.txHash }}
            </font>
          </template>
          <template #cell(account)="data">
            <b-link @click="showModalAddress(data.item.account);">{{ ensOrAccount(data.item.account) }}</b-link>
            <br />
            <font size="-1">
              <b-badge v-if="data.item.account != data.item.from" pill variant="warning" @click="showModalAddress(data.item.from);" v-b-popover.hover.top="'Transaction sender, if different from account'">{{ ensOrAccount(data.item.from, 20) }}</b-badge>
            </font>
          </template>
          <template #cell(info)="data">
            <font size="-1">
              <b-badge v-if="data.item.info.type" pill variant="info">{{ data.item.info.type }}</b-badge>
              <b-badge v-else pill variant="warning">???</b-badge>
              <b-badge v-if="data.item.info.action" pill variant="primary">{{ data.item.info.action }}</b-badge>
              <b-badge v-else pill variant="warning">?????</b-badge>
              <b-badge v-if="!data.item.info.action" pill variant="primary" v-b-popover.hover="data.item.functionCall">{{ data.item.functionCall.substring(0, 30) + (data.item.functionCall.length > 30 ? '...' : '') }}</b-badge>
            </font>
            <span v-if="data.item.info">
              <span v-if="data.item.info.type == 'eth'">
                <span v-if="data.item.info.action == 'cancelled'">
                  {{ formatETH(data.item.info.amount, 0) }}<font size="-2">Ξ</font>
                  <b-link @click="showModalAddress(data.item.info.to);">{{ ensOrAccount(data.item.info.to) }}</b-link>
                </span>
                <span v-else-if="data.item.info.action == 'sent'">
                  {{ formatETH(data.item.info.amount, 0) }}<font size="-2">Ξ</font>
                  <b-link @click="showModalAddress(data.item.info.to);">{{ ensOrAccount(data.item.info.to) }}</b-link>
                </span>
                <span v-else-if="data.item.info.action == 'received'">
                  {{ formatETH(data.item.info.amount, 0) }}<font size="-2">Ξ</font>
                  <b-link @click="showModalAddress(data.item.info.from);">{{ ensOrAccount(data.item.info.from) }}</b-link>
                </span>
              </span>
              <span v-else-if="data.item.info.type == 'weth'">
                <span v-if="data.item.info.action == 'wrap'">
                  {{ formatETH(data.item.info.amount, 0) }}<font size="-2">Ξ</font>
                </span>
                <span v-else-if="data.item.info.action == 'unwrap'">
                  {{ formatETH(data.item.info.amount, 0) }}<font size="-2">wΞ</font>
                </span>
              </span>
              <span v-else-if="data.item.info.type == 'erc20'">
                <span v-if="data.item.info.action == 'sent'">
                  <b-link @click="showModalAddress(data.item.info.to);">{{ ensOrAccount(data.item.info.to) }}</b-link>
                  {{ data.item.info.tokens }}
                </span>
                <span v-else-if="data.item.info.action == 'received'">
                  <b-link @click="showModalAddress(data.item.info.from);">{{ ensOrAccount(data.item.info.from) }}</b-link>
                  {{ data.item.info.tokens }}
                </span>
                <span v-else-if="data.item.info.action == 'approved'">
                  <b-link @click="showModalAddress(data.item.info.operator);">{{ ensOrAccount(data.item.info.operator) }}</b-link>
                  <span v-if="data.item.info.tokens > 1000000000000000000000"> a large amount</span>
                  <span v-else>{{ data.item.info.tokens }}</span>
                  <span v-if="data.item.info.contract == '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'">wΞ</span>
                  <span v-else><b-link @click="showModalAddress(data.item.info.contract);">{{ ensOrAccount(data.item.info.contract) }}</b-link></span>
                </span>
                <span v-else-if="data.item.info.action == 'airdropped'">
                  {{ data.item.info.tokens }}
                  <b-link @click="showModalAddress(data.item.info.contract);">{{ ensOrAccount(data.item.info.contract) }}</b-link>
                </span>
                <span v-else>
                  <font size="-2">
                    ERC-20: {{ data.item.info }}
                  </font>
                </span>
              </span>
              <span v-else-if="data.item.info.type == 'nft'">
                <span v-if="data.item.info.action == 'sent'">
                  <span v-for="(event, eventIndex) in data.item.info.events" :key="eventIndex">
                    <span v-if="eventIndex != 0">,</span>
                    <b-link @click="showModalNFT(event);">{{ event.contract.substring(0, 12) + ':' + event.tokenId.substring(0, 12) }}</b-link>
                  </span>
                  <b-link @click="showModalAddress(data.item.info.events[0].to);">{{ ensOrAccount(data.item.info.events[0].to) }}</b-link>
                </span>
                <span v-else-if="data.item.info.action == 'received'">
                  <span v-for="(event, eventIndex) in data.item.info.events" :key="eventIndex">
                    <span v-if="eventIndex != 0">,</span>
                    <b-link @click="showModalNFT(event);">{{ event.contract.substring(0, 12) + ':' + event.tokenId.substring(0, 12) }}</b-link>
                  </span>
                  <b-link @click="showModalAddress(data.item.info.from);">{{ ensOrAccount(data.item.info.from) }}</b-link>
                </span>
                <span v-else-if="data.item.info.action == 'minted'">
                  <span v-for="(event, eventIndex) in data.item.info.events" :key="eventIndex">
                    <span v-if="eventIndex != 0">,</span>
                    <b-link @click="showModalNFT(event);">{{ event.contract.substring(0, 12) + ':' + event.tokenId.substring(0, 12) }}</b-link>
                  </span>
                  {{ formatETH(data.item.info.value, 0) }}<font size="-2">Ξ</font>
                </span>
                <span v-else-if="data.item.info.action == 'airdropped'">
                  <span v-for="(event, eventIndex) in data.item.info.events" :key="eventIndex">
                    <span v-if="eventIndex != 0">,</span>
                    <b-link @click="showModalNFT(event);">{{ event.contract.substring(0, 12) + ':' + event.tokenId.substring(0, 12) }}</b-link>
                  </span>
                </span>
                <span v-else-if="data.item.info.action == 'purchased'">
                  <span v-for="(event, eventIndex) in data.item.info.events" :key="eventIndex">
                    <span v-if="eventIndex != 0">,</span>
                    <b-link @click="showModalNFT(event);">{{ event.contract.substring(0, 12) + ':' + event.tokenId.substring(0, 12) }}</b-link>
                  </span>
                  {{ formatETH(data.item.info.value, 0) }}<font size="-2">Ξ</font>
                </span>
                <span v-else-if="data.item.info.action == 'sold'">
                  <span v-for="(event, eventIndex) in data.item.info.events" :key="eventIndex">
                    <span v-if="eventIndex != 0">,</span>
                    <b-link @click="showModalNFT(event);">{{ event.contract.substring(0, 12) + ':' + event.tokenId.substring(0, 12) }}</b-link>
                  </span>
                  {{ formatETH(data.item.info.value, 0) }}
                  <span v-if="data.item.info.valueToken == 'eth'"><font size="-2">Ξ</font></span>
                  <span v-else-if="data.item.info.valueToken == '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'"><font size="-2">wΞ</font></span>
                  <span v-else><font size="-2"><b-link @click="showModalAddress(data.item.info.valueToken);">{{ ensOrAccount(data.item.info.valueToken) }}</b-link></font></span>
                </span>
                <span v-else-if="data.item.info.action == 'approvedforall'">
                  <b-link @click="showModalAddress(data.item.info.operator);">{{ ensOrAccount(data.item.info.operator) }}</b-link>
                  <b-link @click="showModalNFTCollection(data.item.info.contract);">{{ data.item.info.contract.substring(0, 12) }}</b-link>
                  {{ data.item.info.approved }}
                </span>
                <span v-else-if="data.item.info.action == 'offered'">
                  <span v-if="data.item.info.events" v-for="(event, eventIndex) in data.item.info.events" :key="eventIndex">
                    <span v-if="eventIndex != 0">,</span>
                    <b-link @click="showModalNFT(event);">{{ event.contract.substring(0, 12) + ':' + event.tokenId.substring(0, 12) }}</b-link>
                  </span>
                  <span v-if="data.item.info.minValue">{{ formatETH(data.item.info.minValue, 0) }}<font size="-2">Ξ</font></span>
                  <span v-if="data.item.info.to"><b-link @click="showModalAddress(data.item.info.to);">{{ ensOrAccount(data.item.info.to) }}</b-link></span>

                </span>
                <span v-else-if="data.item.info.action == 'offerremoved'">
                  <span v-for="(event, eventIndex) in data.item.info.events" :key="eventIndex">
                    <span v-if="eventIndex != 0">,</span>
                    <b-link @click="showModalNFT(event);">{{ event.contract.substring(0, 12) + ':' + event.tokenId.substring(0, 12) }}</b-link>
                  </span>
                </span>
                <span v-else>
                  <font size="-2">
                    NFT: {{ data.item.info }}
                  </font>
                </span>
              </span>
              <span v-else-if="data.item.info.type == 'ens'">
                <span v-if="data.item.info.action == 'committed'">
                  {{ data.item.info.commitment.substring(0, 20) + '...' }}
                </span>
                <span v-else-if="data.item.info.action == 'bulkcommitted'">
                </span>
                <span v-else-if="data.item.info.action == 'registered'">
                  <span v-for="(event, eventIndex) in data.item.info.events" :key="eventIndex">
                    <span v-if="eventIndex != 0">,</span>
                    <b-link @click="showModalENS(event);">{{ event.name + '.eth' }}</b-link> until {{ formatTimestamp(event.expires) }}
                  </span>
                  for
                  {{ formatETH(data.item.info.totalCost, 0) }}<font size="-2">Ξ</font>
                </span>
                <span v-else-if="data.item.info.action == 'renewed'">
                  <span v-for="(event, eventIndex) in data.item.info.events" :key="eventIndex">
                    <span v-if="eventIndex != 0">,</span>
                    <b-link @click="showModalENS(event);">{{ event.name + '.eth' }}</b-link> until {{ formatTimestamp(event.expires) }}
                  </span>
                  for
                  {{ formatETH(data.item.info.totalCost, 0) }}<font size="-2">Ξ</font>
                </span>
                <span v-else-if="data.item.info.action == 'reverseensset'">
                  {{ data.item.info.tokenId }}
                  <!-- {{ data.item.info.node }} -->
                  <b-link @click="showModalAddress(data.item.info.a);">{{ data.item.info.a }}</b-link>
                </span>
                <span v-else-if="data.item.info.action == 'contenthashset'">
                  {{ data.item.info.tokenId }}
                  <!-- {{ data.item.info.node }} -->
                  {{ data.item.info.hash.substring(0, 20) + '...' }}
                </span>
                <span v-else-if="data.item.info.action == 'resolverset'">
                  {{ data.item.info.tokenId }}
                  <!-- {{ data.item.info.node }} -->
                  <b-link @click="showModalAddress(data.item.info.resolver);">{{ data.item.info.resolver }}</b-link>
                </span>
                <span v-else-if="data.item.info.action == 'textset'">
                  {{ data.item.info.tokenId }}
                  {{ data.item.info.key }}
                  {{ data.item.info.value }}
                </span>
                <span v-else-if="data.item.info.action == 'nameset'">
                  {{ data.item.info.name }}
                </span>
                <span v-else-if="data.item.info.action == 'multicalled'">
                  <span v-for="(item, itemIndex) in data.item.info.data" :key="itemIndex">
                    <span v-if="itemIndex != 0">,</span>
                    {{ itemIndex + 1 }}. {{ item }}
                  </span>
                </span>
                <span v-else>
                  <font size="-2">
                    ENS: {{ data.item.info }}
                  </font>
                </span>
              </span>
              <span v-else-if="data.item.info.type == 'contract'">
                <span v-if="data.item.info.action == 'ownershiptransferred'">
                  <b-link @click="showModalAddress(data.item.info.newOwner);">{{ data.item.info.newOwner }}</b-link>
                </span>
                <span v-else>
                  <font size="-2">
                    contract: {{ data.item.info }}
                  </font>
                </span>
              </span>
              <span v-else>
                <font size="-2">
                  {{ data.item.info }}
                </font>
              </span>
            </span>
            <span v-else>
              <font size="-2">
                TODO: {{ data.item.functionCall }}
              </font>
            </span>
            <div v-if="data.item.myEvents && data.item.myEvents.length > 0">
              <font size="-2">
                <b-table small fixed striped sticky-header="200px" :fields="myEventsFields" :items="data.item.myEvents" head-variant="light">
                  <template #cell(from)="data">
                    <b-link @click="showModalAddress(data.item.from);">{{ ensOrAccount(data.item.from, 16) }}</b-link>
                  </template>
                  <template #cell(to)="data">
                    <b-link @click="showModalAddress(data.item.to);">{{ ensOrAccount(data.item.to, 16) }}</b-link>
                  </template>
                  <template #cell(contract)="data">
                    <span v-if="data.item.contract == 'eth'">
                      eth
                    </span>
                    <span v-else-if="data.item.contract == '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'">
                      <b-link @click="showModalAddress(data.item.contract);">weth</b-link>
                    </span>
                    <span v-else>
                      <span v-if="data.item.type == 'preerc721' || data.item.type == 'erc721' || data.item.type == 'erc1155'">
                        <b-link @click="showModalNFTCollection(data.item.contract);">{{ ensOrAccount(data.item.contract, 16) }}</b-link>
                      </span>
                      <span v-else>
                        <b-link @click="showModalAddress(data.item.contract);">{{ ensOrAccount(data.item.contract, 16) }}</b-link>
                      </span>
                    </span>
                  </template>
                  <template #cell(tokenIdOrTokens)="data">
                    <span div="data.item.tokenId">
                      {{ data.item.tokenId }}
                    </span>
                    <span div="data.item.tokens">
                      <span v-if="data.item.contract == 'eth'">
                        {{ formatETH(data.item.tokens) }}
                      </span>
                      <span v-else-if="data.item.contract == '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'">
                        {{ formatETH(data.item.tokens) }}
                      </span>
                      <span v-else>
                        {{ data.item.tokens }}
                      </span>
                    </span>
                  </template>
                </b-table>
              </font>
            </div>
          </template>
          <template #cell(balance)="data">
            <div v-if="data.item.balance">
              {{ formatETH(data.item.balance, 0) }}<font size="-2">Ξ</font>
              <br />
              <font size="-2">
                {{ formatETH(data.item.balanceInReportingCurrency, 2) }} {{ reportingCurrency }} @ {{ formatETH(data.item.exchangeRate, 2) }}
                <span v-if="data.item.diff != 0">Diff {{ formatETH(data.item.diff) }}</span>
              </font>
            </div>
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
        showAdditionalFilters: false,
        filters: {},
        version: 3,
      },
      modalAddress: null,
      modalTx: {
        hash: null,
        timestamp: null,
        tx: null,
        txReceipt: null,
        txFee: null,
        functionSelector: null,
        functionCall: null,
        info: null,
      },
      modalNFTCollection: {
        nftCollection: null,
      },
      modalNFT: {
        nftEvent: null,
      },
      modalENS: {
        ensEvent: null,
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
        { key: 'account', label: 'Account', sortable: false, thStyle: 'width: 15%;', tdClass: 'text-truncate' },
        // { key: 'from', label: 'From', sortable: false, thStyle: 'width: 15%;', tdClass: 'text-truncate' },
        // { key: 'to', label: 'To', sortable: false, thStyle: 'width: 15%;', tdClass: 'text-truncate' },
        { key: 'info', label: 'Info', sortable: false, thStyle: 'width: 50%;' /*, tdClass: 'text-truncate' */ },
        { key: 'balance', label: 'Balance', sortable: false, thStyle: 'width: 15%;', tdClass: 'text-truncate' },
        // { key: 'account', label: 'Account', sortable: false, thStyle: 'width: 35%;', tdClass: 'text-truncate' },
      ],
      accountsFilterFields: [
        { key: 'select', label: '', thStyle: 'width: 15%;' },
        { key: 'account', label: 'Account' },
        { key: 'count', label: '#', sortable: true, thStyle: 'width: 20%;', thClass: 'text-right', tdClass: 'text-right' },
      ],
      typesFilterFields: [
        { key: 'select', label: '', thStyle: 'width: 15%;' },
        { key: 'type', label: 'Type' },
        { key: 'count', label: '#', sortable: true, thStyle: 'width: 20%;', thClass: 'text-right', tdClass: 'text-right' },
      ],
      actionsFilterFields: [
        { key: 'select', label: '', thStyle: 'width: 15%;' },
        { key: 'action', label: 'Action' },
        { key: 'count', label: '#', sortable: true, thStyle: 'width: 20%;', thClass: 'text-right', tdClass: 'text-right' },
      ],
      functionCallsFilterFields: [
        { key: 'select', label: '', thStyle: 'width: 5%;' },
        { key: 'functionCall', label: 'Function Call' },
        { key: 'count', label: '#', sortable: true, thStyle: 'width: 10%;', thClass: 'text-right', tdClass: 'text-right' },
      ],
      myEventsFields: [
        { key: 'type', label: 'Type', thStyle: 'width: 10%;' },
        { key: 'logIndex', label: '#', sortable: true, thStyle: 'width: 10%;', thClass: 'text-right', tdClass: 'text-right' },
        { key: 'from', label: 'From', thStyle: 'width: 20%;' },
        { key: 'to', label: 'To', thStyle: 'width: 20%;' },
        { key: 'contract', label: 'Token', thStyle: 'width: 20%;' },
        { key: 'tokenIdOrTokens', label: 'TokenId/Tokens', sortable: true, thStyle: 'width: 20%;', thClass: 'text-right', tdClass: 'text-right' },
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
    periodOptionsUnformatted() {
      const results = [];
      results.push({ value: null, text: "All", data: { startPeriod: null, endPeriod: null } });
      results.push(... store.getters['config/periodOptions']);
      results.push(... store.getters['config/quarterlyOptions']);
      // results.push({ label: 'Quarterly Periods', options: store.getters['config/quarterlyOptions'] });
      // results.push({ value: "nodata", text: "(tx hashes with no data)", data: null });
      return results;
    },
    reportingCurrency() {
      return store.getters['config/settings'].reportingCurrency;
    },
    accounts() {
      return store.getters['data/accounts'];
    },
    txs() {
      return store.getters['data/txs'];
    },
    blocks() {
      return store.getters['data/blocks'];
    },
    functionSelectors() {
      return store.getters['data/functionSelectors'];
    },
    report() {
      return store.getters['report/report'];
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
      return this.report.transactions && this.report.transactions.length || 0;
    },
    filteredTransactions() {
      const results = [];
      let accountFilter = null;
      if (this.settings.filters.accounts && Object.keys(this.settings.filters.accounts).length > 0) {
        accountFilter = this.settings.filters.accounts;
      }
      let typeFilter = null;
      if (this.settings.filters.types && Object.keys(this.settings.filters.types).length > 0) {
        typeFilter = this.settings.filters.types;
      }
      let actionFilter = null;
      if (this.settings.filters.actions && Object.keys(this.settings.filters.actions).length > 0) {
        actionFilter = this.settings.filters.actions;
      }
      let functionCallFilter = null;
      if (this.settings.filters.functionCalls && Object.keys(this.settings.filters.functionCalls).length > 0) {
        functionCallFilter = this.settings.filters.functionCalls;
      }
      if (this.report.transactions) {
        let startPeriod = null;
        let endPeriod = null;
        const txhashFilterLower = this.settings.txhashFilter && this.settings.txhashFilter.toLowerCase() || null;
        const accountFilterLower = this.settings.accountFilter && this.settings.accountFilter.toLowerCase() || null;
        if (this.settings.period != null && this.settings.period != "nodata") {
          const periodRecords = this.periodOptionsUnformatted.filter(e => e.value === this.settings.period);
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
        for (const [index, transaction] of this.report.transactions.entries()) {
          let include = true;
          if (startPeriod != null && transaction.timestamp < startPeriod.unix()) {
            include = false;
          }
          if (include && endPeriod != null && transaction.timestamp > endPeriod.unix()) {
            include = false;
          }
          if (include && txhashFilterLower != null) {
            if (!(transaction.txHash.includes(txhashFilterLower))) {
              include = false;
            }
          }
          if (include && accountFilterLower != null) {
            const fromENS = this.ensMap[transaction.from] || null;
            if (
              !(transaction.from.toLowerCase().includes(accountFilterLower)) &&
              // !(transaction.to.toLowerCase().includes(accountFilterLower)) &&
              !(fromENS != null && fromENS.toLowerCase().includes(accountFilterLower))
            ) {
              include = false;
            }
          }
          if (include && accountFilter != null) {
            if (!(transaction.account in accountFilter)) {
              include = false;
            }
          }
          if (include && typeFilter != null) {
            const infoType = transaction.info && transaction.info.type || "(unknown)";
            if (!(infoType in typeFilter)) {
              include = false;
            }
          }
          if (include && actionFilter != null) {
            const infoAction = transaction.info && transaction.info.action || "(unknown)";
            if (!(infoAction in actionFilter)) {
              include = false;
            }
          }
          if (include && functionCallFilter != null) {
            const tempFunctionCall = transaction.functionCall.length > 0 && transaction.functionCall || "(none)";
            if (!(tempFunctionCall in functionCallFilter)) {
              include = false;
            }
          }

          if (include) {
            results.push({
              chainId: transaction.chainId,
              txHash: transaction.txHash,
              blockNumber: transaction.blockNumber,
              transactionIndex: transaction.transactionIndex,
              timestamp: transaction.timestamp,
              account: transaction.account,
              from: transaction.from,
              to: transaction.to,
              functionCall: transaction.functionCall,
              exchangeRate: transaction.exchangeRate,
              info: transaction.info,
              balance: transaction.balance,
              balanceInReportingCurrency: transaction.balanceInReportingCurrency,
              expectedBalance: transaction.expectedBalance,
              diff: transaction.diff,
              myEvents: transaction.myEvents,
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
    getAllAccounts() {
      const accountsMap = {};
      for (const transaction of this.filteredTransactions) {
        if (!(transaction.account in accountsMap)) {
          accountsMap[transaction.account] = 0;
        }
        accountsMap[transaction.account]++;
      }
      const results = [];
      for (const [k, v] of Object.entries(accountsMap)) {
        results.push({ account: k, count: v });
      }
      results.sort((a, b) => {
        return ('' + a.account).localeCompare(b.account);
      });
      return results;
    },
    getAllTypes() {
      const typesMap = {};
      for (const transaction of this.filteredTransactions) {
        const t = transaction.info.type && transaction.info.type.length > 0 && transaction.info.type || "(unknown)";
        typesMap[t] = (t in typesMap) ? parseInt(typesMap[t]) + 1 : 1;
      }
      const results = [];
      for (const [k, v] of Object.entries(typesMap)) {
        results.push({ type: k, count: v });
      }
      results.sort((a, b) => {
        return ('' + a.type).localeCompare(b.type);
      });
      return results;
    },
    getAllActions() {
      const actionsMap = {};
      for (const transaction of this.filteredTransactions) {
        const a = transaction.info.action && transaction.info.action.length > 0 && transaction.info.action || "(unknown)";
        actionsMap[a] = (a in actionsMap) ? parseInt(actionsMap[a]) + 1 : 1;
      }
      const results = [];
      for (const [k, v] of Object.entries(actionsMap)) {
        results.push({ action: k, count: v });
      }
      results.sort((a, b) => {
        return ('' + a.action).localeCompare(b.action);
      });
      return results;
    },
    getAllFunctionCalls() {
      const functionCallsMap = {};
      for (const transaction of this.filteredTransactions) {
        functionCallsMap[transaction.functionCall] = (transaction.functionCall in functionCallsMap) ? parseInt(functionCallsMap[transaction.functionCall]) + 1 : 1;
      }
      const results = [];
      for (const [k, v] of Object.entries(functionCallsMap)) {
        results.push({ functionCall: k, count: v });
      }
      results.sort((a, b) => {
        return ('' + a.functionCall).localeCompare(b.functionCall);
      });
      return results;
    },
  },
  methods: {
    formatTimestamp(ts) {
      if (ts != null) {
        return moment.unix(ts).format("YYYY-MM-DD HH:mm:ss");
      }
      return null;
    },
    formatETH(e, precision = 9) {
      try {
        if (precision == 0) {
          return e ? ethers.utils.formatEther(e) : null;
        } else {
          return e ? parseFloat(ethers.utils.formatEther(e)).toFixed(precision) : null;
        }
      } catch (err) {
      }
      return e.toFixed(precision);
    },
    formatGwei(e) {
      return ethers.utils.formatUnits(e, 'gwei');
    },
    formatNumber(e) {
      return ethers.BigNumber.from(e).toString();
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
    filterChanged(dataType, option) {
      if (!this.settings.filters[dataType]) {
        Vue.set(this.settings.filters, dataType, {});
      }
      if (this.settings.filters[dataType][option]) {
        Vue.delete(this.settings.filters[dataType], option);
        if (Object.keys(this.settings.filters[dataType]) == 0) {
          Vue.delete(this.settings.filters, dataType);
        }
      } else {
        Vue.set(this.settings.filters[dataType], option, true);
      }
      localStorage.reportSettings = JSON.stringify(this.settings);
    },
    resetAdditionalFilters() {
      Vue.set(this.settings, 'filters', {});
      localStorage.reportSettings = JSON.stringify(this.settings);
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
    showModalAddress(modalAddress) {
      this.modalAddress = modalAddress;
      this.$bvModal.show('modal-account');
    },
    showModalTx(modalTxHash) {
      this.modalTx.hash = modalTxHash;
      const txData = this.txs[this.network.chainId] && this.txs[this.network.chainId][modalTxHash] || null;
      const block = txData && txData.txReceipt && this.blocks[this.network.chainId] && this.blocks[this.network.chainId][txData.txReceipt.blockNumber] || null;
      this.modalTx.timestamp = block && block.timestamp || null;
      this.modalTx.tx = txData && txData.tx || null;
      this.modalTx.txReceipt = txData && txData.txReceipt || null;
      const gasUsed = ethers.BigNumber.from(txData.txReceipt.gasUsed);
      this.modalTx.txFee = gasUsed.mul(txData.txReceipt.effectiveGasPrice);
      if (txData.tx.to != null && txData.tx.data.length > 9) {
        this.modalTx.functionSelector = txData.tx.data.substring(0, 10);
        this.modalTx.functionCall = this.functionSelectors[this.modalTx.functionSelector] && this.functionSelectors[this.modalTx.functionSelector].length > 0 && this.functionSelectors[this.modalTx.functionSelector][0] || this.modalTx.functionSelector;
      } else {
        this.modalTx.functionSelector = "";
        this.modalTx.functionCall = "";
      }
      this.modalTx.info = "info";
      console.log("modalTx: " + JSON.stringify(this.modalTx, null, 2));
      this.$bvModal.show('modal-tx');
    },
    showModalNFTCollection(nftCollection) {
      this.modalNFTCollection.nftCollection = nftCollection;
      this.$bvModal.show('modal-nft-collection');
    },
    showModalNFT(nftEvent) {
      this.modalNFT.nftEvent = nftEvent;
      this.$bvModal.show('modal-nft');
    },
    showModalENS(ensEvent) {
      this.modalENS.ensEvent = ensEvent;
      this.$bvModal.show('modal-ens');
    },
    copyToClipboard(str) {
      navigator.clipboard.writeText(str);
      // Below does not work when copying from modal dialog window
      // // https://github.com/30-seconds/30-seconds-of-code/blob/master/snippets/copyToClipboard.md
      // const el = document.createElement('textarea');
      // console.log("HERE 1");
      // el.value = str;
      // el.setAttribute('readonly', '');
      // el.style.position = 'absolute';
      // el.style.left = '-9999px';
      // document.body.appendChild(el);
      // console.log("HERE 2");
      // const selected =
      //   document.getSelection().rangeCount > 0
      //     ? document.getSelection().getRangeAt(0)
      //     : false;
      // el.select();
      // console.log("HERE 3");
      // document.execCommand('copy');
      // document.body.removeChild(el);
      // console.log("HERE 4");
      // if (selected) {
      //   document.getSelection().removeAllRanges();
      //   document.getSelection().addRange(selected);
      // }
      // console.log("HERE 5");
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
    store.dispatch('report/restoreState');
    if ('reportSettings' in localStorage) {
      const tempSettings = JSON.parse(localStorage.reportSettings);
      if ('version' in tempSettings && tempSettings.version == 3) {
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
    report: {},
  },
  getters: {
    report: state => state.report,
  },
  mutations: {
    setState(state, info) {
      Vue.set(state, info.name, info.data);
    },
    setReport(state, report) {
      Vue.set(state, 'report', report);
    },
  },
  actions: {
    async restoreState(context) {
      logInfo("reportModule", "restoreState()");
      if (Object.keys(context.state.report) == 0) {
        const db = store.getters['data/db'];
        const db0 = new Dexie(db.name);
        db0.version(db.version).stores(db.schemaDefinition);
        for (let type of ['report']) {
          const data = await db0.cache.where("objectName").equals(type).toArray();
          if (data.length == 1) {
            context.commit('setState', { name: type, data: data[0].object });
          }
        }
      }
    },
    async saveData(context, types) {
      logInfo("reportModule", "actions.saveData - types: " + JSON.stringify(types));
      const db = store.getters['data/db'];
      const db0 = new Dexie(db.name);
      db0.version(db.version).stores(db.schemaDefinition);
      for (let type of types) {
        await db0.cache.put({ objectName: type, object: context.state[type] }).then (function() {
        }).catch(function(error) {
          console.log("error: " + error);
        });
      }
      db0.close();
    },
    async generateReport(context, contractOrTxOrBlockRange) {
      logInfo("reportModule", "generateReport(): " + contractOrTxOrBlockRange);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const allAccounts = store.getters['data/accounts'];
      const allAccountsInfo = store.getters['data/accountsInfo'];
      const functionSelectors = store.getters['data/functionSelectors'];
      const allTxs = store.getters['data/txs'];
      const exchangeRates = store.getters['data/exchangeRates'];
      const blocks = store.getters['data/blocks'];
      const devSettings = store.getters['config/devSettings'];
      const preERC721s = store.getters['config/settings'].preERC721s;
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
      const accountsMap = {};
      const typesMap = {};
      const actionsMap = {};
      const functionCallsMap = {};
      const accumulatedData = {};
      const transactions = [];
      for (const [chainId, accounts] of Object.entries(allAccounts)) {
        const txs = allTxs[chainId] || {};
        for (const [account, accountData] of Object.entries(accounts)) {
          const accountsInfo = store.getters['data/accountsInfo'][chainId][account];
          if (accountsInfo.mine && accountsInfo.report) {
            console.log("--- Processing " + chainId + ":" + account + " ---");
            const txHashesByBlocks = getTxHashesByBlocks(account, chainId, allAccounts, allAccountsInfo, devSettings.skipBlocks, devSettings.maxBlocks);
            let blocksProcessed = 0;
            let prevBalance = ethers.BigNumber.from(0);
            for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
              if (blocksProcessed >= devSettings.skipBlocks && blocksProcessed < devSettings.maxBlocks) {
                const block = blocks[chainId] && blocks[chainId][blockNumber] || null;
                const balance = ethers.BigNumber.from(block && block.balances[account] || 0);
                const exchangeRate = getExchangeRate(moment.unix(block.timestamp), exchangeRates);
                let totalEthReceived = ethers.BigNumber.from(0);
                let totalEthPaid = ethers.BigNumber.from(0);
                let totalTxFee = ethers.BigNumber.from(0);
                const txsToProcess = [];
                for (const [index, txHash] of Object.keys(txHashes).entries()) {
                  const tx = txs && txs[txHash] || null;
                  if (tx) {
                    txsToProcess.push(tx);
                  }
                }
                txsToProcess.sort((a, b) => a.txReceipt.transactionIndex - b.txReceipt.transactionIndex);
                const balanceInReportingCurrency = ethers.utils.formatEther(balance) * exchangeRate.rate;
                for (const [index, tx] of txsToProcess.entries()) {
                  // console.log("  + " + tx.txReceipt.transactionIndex + " " + tx.tx.hash); //  + " " + functionCall);
                  const results = parseTx(chainId, account, accounts, functionSelectors, preERC721s, tx);
                  totalEthPaid = totalEthPaid.add(results.ethPaid);
                  totalEthReceived = totalEthReceived.add(results.ethReceived);
                  const gasUsed = ethers.BigNumber.from(tx.txReceipt.gasUsed);
                  const txFee = tx.tx.from == account ? gasUsed.mul(tx.txReceipt.effectiveGasPrice) : 0;
                  totalTxFee = totalTxFee.add(txFee);
                  const expectedBalance = prevBalance.add(totalEthReceived).sub(totalEthPaid).sub(totalTxFee);
                  const diff = balance.sub(expectedBalance);
                  if (!(account in accountsMap)) {
                    accountsMap[account] = 0;
                  }
                  accountsMap[account]++;
                  const infoType = results.info && results.info.type || "(unknown)";
                  if (!(infoType in typesMap)) {
                    typesMap[infoType] = 0;
                  }
                  typesMap[infoType]++;
                  const infoAction = results.info && results.info.action || "(unknown)";
                  if (!(infoAction in actionsMap)) {
                    actionsMap[infoAction] = 0;
                  }
                  actionsMap[infoAction]++;
                  const tempFunctionCall = results.functionCall.length > 0 && results.functionCall || "(none)";
                  if (!(tempFunctionCall in functionCallsMap)) {
                    functionCallsMap[tempFunctionCall] = 0;
                  }
                  functionCallsMap[tempFunctionCall]++;
                  const isLastTxInBlock = (index + 1 == txsToProcess.length);
                  transactions.push({
                    chainId,
                    txHash: tx.tx.hash,
                    blockNumber: blockNumber,
                    transactionIndex: tx.txReceipt.transactionIndex,
                    timestamp: block.timestamp,
                    account,
                    from: tx.tx.from,
                    to: tx.tx.to,
                    functionSelector: results.functionSelector,
                    functionCall: results.functionCall,
                    exchangeRate: exchangeRate.rate,
                    info: results.info || "",
                    txType: results.info && results.info.type || "unknown",
                    txAction: results.info && results.info.action || "unknown",
                    balance: isLastTxInBlock ? balance.toString() : null,
                    balanceInReportingCurrency: isLastTxInBlock ? balanceInReportingCurrency : null,
                    expectedBalance: isLastTxInBlock ? expectedBalance.toString() : null,
                    diff: isLastTxInBlock ? diff.toString() : null,
                    myEvents: results.myEvents,
                  });
                }
                // console.log("∟ " + moment.unix(block.timestamp).format("YYYY-MM-DD HH:mm:ss") + " " + blockNumber + " " + ethers.utils.formatEther(prevBalance) + "+" + ethers.utils.formatEther(totalEthReceived) + "-" + ethers.utils.formatEther(totalEthPaid) + "-" + ethers.utils.formatEther(totalTxFee) + " => " + (diff != 0 ? "DIFF " : "") + ethers.utils.formatEther(diff) + "+" + ethers.utils.formatEther(balance) + " " + balanceInReportingCurrency.toFixed(2) + " @ " + exchangeRate.rate);
                prevBalance = balance;
              }
              blocksProcessed++;
            }
          }
        }
      }
      // TODO: Delete accountsMap, typesMap, actionsMap, functionCallsMap
      context.commit('setReport', { transactions, accountsMap, typesMap, actionsMap, functionCallsMap });
      context.dispatch('saveData', ['report']);
    },
  },
};
