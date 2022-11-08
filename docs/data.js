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
    accounts: {}, // TODO: Add chainId
    txs: {},
    assets: {}, // TODO: ChainId/Contract/TokenId/Number
    ensMap: {},
    sync: {
      section: null,
      total: null,
      completed: null,
      halt: false,
    },
    db: {
      name: "txs090b",
      version: 1,
      schemaDefinition: {
        cache: '&objectName',
        // collection: '&address',
      },
      updated: null,
    },
  },
  getters: {
    accounts: state => state.accounts,
    txs: state => state.txs,
    assets: state => state.assets,
    ensMap: state => state.ensMap,
    sync: state => state.sync,
  },
  mutations: {
    toggleAccountMine(state, key) {
      Vue.set(state.accounts[key], 'mine', !state.accounts[key].mine);
    },
    toggleAccountSync(state, key) {
      Vue.set(state.accounts[key], 'sync', !state.accounts[key].sync);
    },
    setAccountType(state, info) {
      Vue.set(state.accounts[info.key], 'type', info.accountType);
    },
    setGroup(state, info) {
      Vue.set(state.accounts[info.key], 'group', info.group);
    },
    setName(state, info) {
      Vue.set(state.accounts[info.key], 'name', info.name);
    },
    setNotes(state, info) {
      Vue.set(state.accounts[info.key], 'notes', info.notes);
    },
    addNewAccount(state, accountInfo) {
      // logInfo("dataModule", "mutations.addNewAccount(" + JSON.stringify(accountInfo) + ")");
      const block = store.getters['connection/block'];
      const network = store.getters['connection/network'];
      const chainId = network.chainId;
      const key = chainId + ':' + accountInfo.account;
      Vue.set(state.accounts, key, {
        group: null,
        name: null,
        type: accountInfo && accountInfo.type || null,
        mine: accountInfo.account == store.getters['connection/coinbase'],
        sync: accountInfo.account == store.getters['connection/coinbase'],
        tags: [],
        notes: null,
        contract: {
          name: accountInfo && accountInfo.name || null,
          symbol: accountInfo && accountInfo.symbol || null,
          decimals: accountInfo && accountInfo.decimals || null,
        },
        collection: accountInfo && accountInfo.collection || {},
        balances: accountInfo && accountInfo.balances || {},
        created: {
          timestamp: block && block.timestamp || null,
          blockNumber: block && block.number || null,
        },
        transactions: {},
        internalTransactions: {},
        events: {},
        updated: {
          timestamp: null,
          blockNumber: null,
        },
      });
    },
    addAccountERC20AndERC721Events(state, info) {
      const [accountKey, events] = [info.accountKey, info.events];
      const account = state.accounts[accountKey];
      for (const event of events) {
        if (!event.removed) {
          if (!(event.transactionHash in account.events)) {
            account.events[event.transactionHash] = {};
          }
          const tempEvent = {...event, type: event.topics.length == 4 ? "erc721" : "erc20", processed: null };
          delete tempEvent.transactionHash;
          delete tempEvent.logIndex;
          delete tempEvent.removed;
          account.events[event.transactionHash][event.logIndex] = tempEvent;
        }
      }
    },
    addAccountERC1155Events(state, info) {
      const [accountKey, events] = [info.accountKey, info.events];
      const account = state.accounts[accountKey];
      for (const event of events) {
        if (!event.removed) {
          if (!(event.transactionHash in account.events)) {
            account.events[event.transactionHash] = {};
          }
          const tempEvent = {...event, type: "erc1155", processed: null };
          delete tempEvent.transactionHash;
          delete tempEvent.logIndex;
          delete tempEvent.removed;
          account.events[event.transactionHash][event.logIndex] = tempEvent;
        }
      }
    },
    addAccountInternalTransactions(state, info) {
      const [accountKey, results] = [info.accountKey, info.results];
      const account = state.accounts[accountKey];
      for (const result of results) {
        if (!(result.hash in account.internalTransactions)) {
          account.internalTransactions[result.hash] = {};
        }
        const tempResult = {...result, processed: null};
        delete tempResult.hash;
        delete tempResult.traceId;
        account.internalTransactions[result.hash][result.traceId] = tempResult;
      }
    },
    addAccountTransactions(state, info) {
      const [accountKey, results] = [info.accountKey, info.results];
      const account = state.accounts[accountKey];
      for (const result of results) {
        if (!(result.hash in account.transactions)) {
          const tempResult = {...result, processed: null};
          delete tempResult.hash;
          account.transactions[result.hash] = tempResult;
        }
      }
    },
    updateAccountTimestampAndBlock(state, info) {
      const network = store.getters['connection/network'];
      const chainId = network.chainId;
      const key = chainId + ':' + info.account;
      Vue.set(state.accounts[key], 'updated', {
        timestamp: info.timestamp,
        blockNumber: info.blockNumber,
      });
    },
    addENSName(state, nameInfo) {
      Vue.set(state.ensMap, nameInfo.account, nameInfo.name);
    },
    importEtherscanResults(state, info) {
      logInfo("dataModule", "mutations.importEtherscanResults - info: " + JSON.stringify(info).substring(0, 1000));
      const [account, results] = [info.account, info.results];
      const block = store.getters['connection/block'];
      for (const result of results) {
        if (!(result.hash in state.txs)) {
          Vue.set(state.txs, result.hash, {
            blockNumber: result.blockNumber,
            timestamp: result.timeStamp,
            nonce: result.nonce,
            blockHash: result.blockHash,
            transactionIndex: result.transactionIndex,
            from: ethers.utils.getAddress(result.from),
            to: (result.to == null || result.to.length <= 2) ? null : ethers.utils.getAddress(result.to),
            value: result.value,
            gas: result.gas,
            gasPrice: result.gasPrice,
            isError: result.isError,
            txReceiptStatus: result.txreceipt_status,
            input: result.input,
            contractAddress: (result.contractAddress == null || result.contractAddress.length <= 2) ? null : ethers.utils.getAddress(result.contractAddress),
            cumulativeGasUsed: result.cumulativeGasUsed,
            gasUsed: result.gasUsed,
            confirmations: result.confirmations,
            methodId: result.methodId,
            functionName: result.functionName,
            etherscanImported: {
              account,
              timestamp: block && block.timestamp || null,
              blockNumber: block && block.number || null,
            },
            dataImported: {
              tx: null,
              txReceipt: null,
              balances: {},
              balancePreviousBlock: {},
              timestamp: null,
              blockNumber: null,
            },
            computed: {
              info: {},
              timestamp: null,
              blockNumber: null,
            },
          });
        }
      }
    },
    updateTxData(state, info) {
      logInfo("dataModule", "mutations.updateTxData - info: " + JSON.stringify(info).substring(0, 1000));
      Vue.set(state.txs[info.txHash].dataImported, 'tx', {
        hash: info.tx.hash,
        type: info.tx.type,
        blockHash: info.tx.blockHash,
        blockNumber: info.tx.blockNumber,
        transactionIndex: info.tx.transactionIndex,
        from: info.tx.from,
        gasPrice: info.tx.gasPrice,
        gasLimit: info.tx.gasLimit,
        to: info.tx.to,
        value: info.tx.value,
        nonce: info.tx.nonce,
        data: info.tx.data,
        r: info.tx.r,
        s: info.tx.s,
        v: info.tx.v,
        chainId: info.tx.chainId,
      });
      Vue.set(state.txs[info.txHash].dataImported, 'txReceipt', info.txReceipt);
      Vue.set(state.txs[info.txHash].computed.info, 'summary', info.summary);
    },
    setSyncSection(state, info) {
      state.sync.section = info.section;
      state.sync.total = info.total;
    },
    setSyncCompleted(state, completed) {
      state.sync.completed = completed;
    },
    setSyncHalt(state, halt) {
      state.sync.halt = halt;
    },
  },
  actions: {
    async restoreState(context) {
      const db0 = new Dexie(context.state.db.name);
      db0.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      const accounts = await db0.cache.where("objectName").equals('accounts').toArray();
      if (accounts.length == 1) {
        context.state.accounts = accounts[0].object;
      }
      const txs = await db0.cache.where("objectName").equals('txs').toArray();
      if (txs.length == 1) {
        context.state.txs = txs[0].object;
      }
      const assets = await db0.cache.where("objectName").equals('assets').toArray();
      if (assets.length == 1) {
        context.state.assets = assets[0].object;
      }
      const ensMap = await db0.cache.where("objectName").equals('ensMap').toArray();
      if (ensMap.length == 1) {
        context.state.ensMap = ensMap[0].object;
      }
    },
    async saveData(context, types) {
      // logInfo("dataModule", "actions.saveData - types: " + JSON.stringify(types));
      const db0 = new Dexie(context.state.db.name);
      db0.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      for (let type of types) {
        await db0.cache.put({ objectName: type, object: context.state[type] }).then (function() {
        }).catch(function(error) {
          console.log("error: " + error);
        });
      }
      db0.close();
    },
    async toggleAccountMine(context, key) {
      context.commit('toggleAccountMine', key);
      context.dispatch('saveData', ['accounts']);
    },
    async toggleAccountSync(context, key) {
      context.commit('toggleAccountSync', key);
      context.dispatch('saveData', ['accounts']);
    },
    async setAccountType(context, info) {
      context.commit('setAccountType', info);
      context.dispatch('saveData', ['accounts']);
    },
    async setGroup(context, info) {
      context.commit('setGroup', info);
      context.dispatch('saveData', ['accounts']);
    },
    async setName(context, info) {
      context.commit('setName', info);
      context.dispatch('saveData', ['accounts']);
    },
    async setNotes(context, info) {
      context.commit('setNotes', info);
      context.dispatch('saveData', ['accounts']);
    },
    async setSyncHalt(context, halt) {
      context.commit('setSyncHalt', halt);
    },
    async resetData(context, section) {
      console.log("data.actions.resetData - section: " + section);
      const db0 = new Dexie(context.state.db.name);
      db0.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      const status = await db0.cache.where("objectName").equals(section).delete();
      console.log("status: " + JSON.stringify(status));
      db0.close();
    },
    async addNewAccounts(context, newAccounts) {
      // logInfo("dataModule", "actions.addNewAccounts(" + JSON.stringify(newAccounts) + ")");
      const accounts = newAccounts == null ? [] : newAccounts.split(/[, \t\n]+/).filter(name => (name.length == 42 && name.substring(0, 2) == '0x'));
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const ensReverseRecordsContract = new ethers.Contract(ENSREVERSERECORDSADDRESS, ENSREVERSERECORDSABI, provider);
      for (let account of accounts) {
        const accountInfo = await getAccountInfo(account, provider)
        if (accountInfo.account) {
          context.commit('addNewAccount', accountInfo);
        }
        const names = await ensReverseRecordsContract.getNames([account]);
        const name = names.length == 1 ? names[0] : account;
        if (!(account in context.state.ensMap)) {
          context.commit('addENSName', { account, name });
        }
      }
      context.dispatch('saveData', ['accounts', 'ensMap']);
    },
    async syncIt(context, info) {
      const sections = info.sections;
      const parameters = info.parameters || [];
      logInfo("dataModule", "actions.syncIt - sections: " + JSON.stringify(sections) + ", parameters: " + JSON.stringify(parameters).substring(0, 1000));
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const ensReverseRecordsContract = new ethers.Contract(ENSREVERSERECORDSADDRESS, ENSREVERSERECORDSABI, provider);
      const etherscanAPIKey = store.getters['config/settings'].etherscanAPIKey && store.getters['config/settings'].etherscanAPIKey.length > 0 && store.getters['config/settings'].etherscanAPIKey || "YourApiKeyToken";
      const etherscanBatchSize = store.getters['config/settings'].etherscanBatchSize && parseInt(store.getters['config/settings'].etherscanBatchSize) || 5_000_000;
      const confirmations = store.getters['config/settings'].confirmations && parseInt(store.getters['config/settings'].confirmations) || 10;
      const block = await provider.getBlock();
      const confirmedBlockNumber = block && block.number && (block.number - confirmations) || null;
      const confirmedBlock = await provider.getBlock(confirmedBlockNumber);
      const confirmedTimestamp = confirmedBlock && confirmedBlock.timestamp || null;

      context.commit('setSyncHalt', false);
      for (let section of sections) {
        if (section == 'importFromEtherscan') {
          const accountsToSync = [];
          for (const [key, item] of Object.entries(context.state.accounts)) {
            const [chainId, account] = key.split(':');
            if (parameters.length == 0) {
              if (item.sync) {
                accountsToSync.push(key);
              }
            } else {
              if (parameters.includes(account)) {
                accountsToSync.push(key);
              }
            }
          }

          let sleepUntil = null;
          for (const keyIndex in accountsToSync) {
            context.commit('setSyncSection', { section: ' Import', total: accountsToSync.length });
            const accountKey = accountsToSync[keyIndex];
            const item = context.state.accounts[accountKey];
            const [chainId, account] = accountKey.split(':');
            context.commit('setSyncCompleted', parseInt(keyIndex) + 1);
            console.log("--- Syncing " + account + " --- ");
            console.log(JSON.stringify(item, null, 2));

            const startBlock = item && item.updated && item.updated.blockNumber && (parseInt(item.updated.blockNumber) + 1) || 0;

            const DEVVING = 1;

            if (DEVVING == 1) {
              context.commit('setSyncSection', { section: 'Web3 Events', total: accountsToSync.length });
              for (let startBatch = startBlock; startBatch < confirmedBlockNumber; startBatch += etherscanBatchSize) {
                const endBatch = (parseInt(startBatch) + etherscanBatchSize < confirmedBlockNumber) ? (parseInt(startBatch) + etherscanBatchSize) : confirmedBlockNumber;
                const erc20AndERC721FilterFrom = {
                  address: null,
                  fromBlock: startBatch,
                  toBlock: endBatch,
                  topics: [
                    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer (index_topic_1 address from, index_topic_2 address to, index_topic_3 uint256 id)
                    '0x000000000000000000000000' + account.substring(2, 42).toLowerCase(),
                    null,
                  ],
                };
                const erc20AndERC721EventsFrom = await provider.getLogs(erc20AndERC721FilterFrom);
                context.commit('addAccountERC20AndERC721Events', { accountKey, events: erc20AndERC721EventsFrom });
                const erc20AndERC721FilterTo = {
                  address: null,
                  fromBlock: startBatch,
                  toBlock: endBatch,
                  topics: [
                    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer (index_topic_1 address from, index_topic_2 address to, index_topic_3 uint256 id)
                    null,
                    '0x000000000000000000000000' + account.substring(2, 42).toLowerCase(),
                  ],
                };
                const erc20AndERC721EventsTo = await provider.getLogs(erc20AndERC721FilterTo);
                context.commit('addAccountERC20AndERC721Events', { accountKey, events: erc20AndERC721EventsTo });
                const erc1155FilterFrom = {
                  address: null,
                  fromBlock: startBatch,
                  toBlock: endBatch,
                  topics: [
                    '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62', // ERC-1155 TransferSingle (index_topic_1 address _operator, index_topic_2 address _from, index_topic_3 address _to, uint256 _id, uint256 _value)
                    null,
                    '0x000000000000000000000000' + account.substring(2, 42).toLowerCase(),
                    null,
                  ],
                };
                const erc1155EventsFrom = await provider.getLogs(erc1155FilterFrom);
                context.commit('addAccountERC1155Events', { accountKey, events: erc1155EventsFrom });
                const erc1155FilterTo = {
                  address: null,
                  fromBlock: startBatch,
                  toBlock: endBatch,
                  topics: [
                    '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62', // ERC-1155 TransferSingle (index_topic_1 address _operator, index_topic_2 address _from, index_topic_3 address _to, uint256 _id, uint256 _value)
                    null,
                    null,
                    '0x000000000000000000000000' + account.substring(2, 42).toLowerCase(),
                  ],
                };
                const erc1155EventsTo = await provider.getLogs(erc1155FilterTo);
                context.commit('addAccountERC1155Events', { accountKey, events: erc1155EventsTo });
              }

              context.commit('setSyncSection', { section: 'Etherscan Internal Txs', total: accountsToSync.length });
              for (let startBatch = startBlock; startBatch < confirmedBlockNumber; startBatch += etherscanBatchSize) {
                const endBatch = (parseInt(startBatch) + etherscanBatchSize < confirmedBlockNumber) ? (parseInt(startBatch) + etherscanBatchSize) : confirmedBlockNumber;
                console.log("batch: " + startBatch + " to " + endBatch + ", sleepUntil: " + (sleepUntil ? moment.unix(sleepUntil).toString() : 'null'));
                do {
                } while (sleepUntil && sleepUntil > moment().unix());
                let importUrl = "https://api.etherscan.io/api?module=account&action=txlistinternal&address=" + account + "&startblock=" + startBatch + "&endblock=" + endBatch + "&page=1&offset=10000&sort=asc&apikey=" + etherscanAPIKey;
                console.log("importUrl: " + importUrl);
                const importData = await fetch(importUrl)
                  .then(handleErrors)
                  .then(response => response.json())
                  .catch(function(error) {
                     console.log("ERROR - processIt: " + error);
                     // Want to work around API data unavailablity - state.sync.error = true;
                     return [];
                  });
                if (importData.status == 1) {
                  context.commit('addAccountInternalTransactions', { accountKey, results: importData.result });
                  if (importData.message && importData.message.includes("Missing")) {
                    sleepUntil = parseInt(moment().unix()) + 6;
                  }
                  if (context.state.sync.halt) {
                    break;
                  }
                }
              }

              context.commit('setSyncSection', { section: 'Etherscan Transactions', total: accountsToSync.length });
              for (let startBatch = startBlock; startBatch < confirmedBlockNumber; startBatch += etherscanBatchSize) {
                const endBatch = (parseInt(startBatch) + etherscanBatchSize < confirmedBlockNumber) ? (parseInt(startBatch) + etherscanBatchSize) : confirmedBlockNumber;
                console.log("batch: " + startBatch + " to " + endBatch + ", sleepUntil: " + (sleepUntil ? moment.unix(sleepUntil).toString() : 'null'));
                do {
                } while (sleepUntil && sleepUntil > moment().unix());
                let importUrl = "https://api.etherscan.io/api?module=account&action=txlist&address=" + account + "&startblock=" + startBatch + "&endblock=" + endBatch + "&page=1&offset=10000&sort=asc&apikey=" + etherscanAPIKey;
                console.log("importUrl: " + importUrl);
                const importData = await fetch(importUrl)
                  .then(handleErrors)
                  .then(response => response.json())
                  .catch(function(error) {
                     console.log("ERROR - processIt: " + error);
                     // Want to work around API data unavailablity - state.sync.error = true;
                     return [];
                  });
                if (importData.status == 1) {
                  context.commit('addAccountTransactions', { accountKey, results: importData.result });
                  if (importData.message && importData.message.includes("Missing")) {
                    sleepUntil = parseInt(moment().unix()) + 6;
                  }
                  if (context.state.sync.halt) {
                    break;
                  }
                }
              }
              context.commit('updateAccountTimestampAndBlock', { account, timestamp: confirmedTimestamp, blockNumber: confirmedBlockNumber });
            }

            if (DEVVING == 0) {
              for (let startBatch = startBlock; startBatch < confirmedBlockNumber; startBatch += etherscanBatchSize) {
                let endBatch = (parseInt(startBatch) + etherscanBatchSize < confirmedBlockNumber) ? (parseInt(startBatch) + etherscanBatchSize) : confirmedBlockNumber;
                console.log("batch: " + startBatch + " to " + endBatch + ", sleepUntil: " + (sleepUntil ? moment.unix(sleepUntil).toString() : 'null'));
                do {
                } while (sleepUntil && sleepUntil > moment().unix());
                let importUrl = "https://api.etherscan.io/api?module=account&action=txlist&address=" + account + "&startblock=" + startBatch + "&endblock=" + endBatch + "&page=1&offset=10000&sort=asc&apikey=" + etherscanAPIKey;
                console.log("importUrl: " + importUrl);
                const importData = await fetch(importUrl)
                  .then(handleErrors)
                  .then(response => response.json())
                  .catch(function(error) {
                     console.log("ERROR - processIt: " + error);
                     // Want to work around API data unavailablity - state.sync.error = true;
                     return [];
                  });
                console.log(JSON.stringify(importData, null, 2).substring(0, 10000));
                if (importData.status == 1) {
                  const newAccounts = {};
                  for (const result of importData.result) {
                    const from = ethers.utils.getAddress(result.from);
                    const to = (result.to == null || result.to.length <= 2) ? null : ethers.utils.getAddress(result.to);
                    const contract = (result.contractAddress == null || result.contractAddress.length <= 2) ? null : ethers.utils.getAddress(result.contractAddress);
                    for (let account of [from, to, contract]) {
                      const accountKey = chainId + ':' + account;
                      if (account && !(accountKey in context.state.accounts) && !(account in newAccounts)) {
                        newAccounts[account] = true;
                      }
                    }
                  }
                  const newAccountsList = Object.keys(newAccounts);
                  context.commit('setSyncSection', { section: (parseInt(keyIndex) + 1) + '/' + accountsToSync.length + ' Accounts', total: newAccountsList.length });
                  for (let accountIndex in newAccountsList) {
                    const account = newAccountsList[accountIndex];
                    context.commit('setSyncCompleted', parseInt(accountIndex) + 1);
                    const accountInfo = await getAccountInfo(account, provider)
                    if (accountInfo.account) {
                      context.commit('addNewAccount', accountInfo);
                      console.log("Added account: " + account + " " + accountInfo.type + " " + accountInfo.name);
                    }
                    const names = await ensReverseRecordsContract.getNames([account]);
                    const name = names.length == 1 ? names[0] : account;
                    if (!(account in context.state.ensMap)) {
                      context.commit('addENSName', { account, name });
                    }
                    if (context.state.sync.halt) {
                      break;
                    }
                  }
                  if (!context.state.sync.halt) {
                    context.commit('importEtherscanResults', { account, results: importData.result });
                    context.commit('updateAccountTimestampAndBlock', { account, timestamp: confirmedTimestamp, blockNumber: confirmedBlockNumber });
                  }
                }
                // Retrieve
                if (importData.message && importData.message.includes("Missing")) {
                  sleepUntil = parseInt(moment().unix()) + 6;
                }
                if (context.state.sync.halt) {
                  break;
                }
              }
            }
            console.log(JSON.stringify(item, null, 2));
          }
          context.dispatch('saveData', ['accounts', 'txs', 'ensMap']);
          context.commit('setSyncSection', { section: null, total: null });

        } else if (section == 'downloadData') {
          console.log("downloadData");
          
        } else if (section == 'computeTxs') {
          console.log("computeTxs");
          context.commit('setSyncSection', { section: 'Compute', total: parameters.length });
          for (let txHashIndex in parameters) {
            const txHash = parameters[txHashIndex];
            const txItem = context.state.txs[txHash];
            if (txItem) {
              const info = await getTxInfo(txHash, txItem, provider);
              if (info.summary) {
                context.commit('updateTxData', info);
              }
            }
            context.commit('setSyncCompleted', parseInt(txHashIndex) + 1);
            if (context.state.sync.halt) {
              break;
            }
          }
        }
        context.dispatch('saveData', ['txs']);
        context.commit('setSyncSection', { section: null, total: null });
      }
    },
    // Called by Connection.execWeb3()
    async execWeb3({ state, commit, rootState }, { count, listenersInstalled }) {
      logInfo("dataModule", "execWeb3() start[" + count + ", " + listenersInstalled + ", " + JSON.stringify(rootState.route.params) + "]");
    },
  },
};
