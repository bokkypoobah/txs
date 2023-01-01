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
    accounts: {}, // [chainId][account] => Account(type, name, symbol, decimals, transactions, internalTransactions, events, ...)
    accountsInfo: {}, // [chainId][account] => Account Info(type, name, symbol, decimals)
    txs: {}, // [chainId][account] => Txs(timestamp, tx, txReceipt)
    txsInfo: {}, // [chainId][account] => Txs Info
    blocks: {}, // [chainId][blockNumber] => timestamp and account balances
    functionSelectors: {}, // [selector] => [functions]
    eventSelectors: {}, // [selector] => [events]
    assets: {},
    ensMap: {},
    exchangeRates: {},
    signatures: { // TODO: Delete
      functionSignatures: {},
      eventSignatures: {},
    },
    sync: {
      section: null,
      total: null,
      completed: null,
      halt: false,
    },
    db: {
      name: "txs091a",
      version: 1,
      schemaDefinition: {
        cache: '&objectName',
      },
      updated: null,
    },
  },
  getters: {
    accounts: state => state.accounts,
    accountsInfo: state => state.accountsInfo,
    txs: state => state.txs,
    txsInfo: state => state.txsInfo,
    blocks: state => state.blocks,
    functionSelectors: state => state.functionSelectors,
    eventSelectors: state => state.eventSelectors,
    assets: state => state.assets,
    ensMap: state => state.ensMap,
    exchangeRates: state => state.exchangeRates,
    signatures: state => state.signatures,
    sync: state => state.sync,
    db: state => state.db,
  },
  mutations: {
    setState(state, info) {
      Vue.set(state, info.name, info.data);
    },
    toggleAccountInfoField(state, info) {
      Vue.set(state.accountsInfo[info.chainId][info.account], info.field, !state.accountsInfo[info.chainId][info.account][info.field]);
    },
    setAccountInfoField(state, info) {
      Vue.set(state.accountsInfo[info.chainId][info.account], info.field, info.value);
    },
    addNewAccountInfo(state, info) {
      logInfo("dataModule", "mutations.addNewAccountInfo(" + JSON.stringify(info) + ")");
      const [block, chainId] = [store.getters['connection/block'], store.getters['connection/chainId']];
      if (!(chainId in state.accountsInfo)) {
        Vue.set(state.accountsInfo, chainId, {});
      }
      if (!(info.accountsInfo in state.accountsInfo[chainId])) {
        Vue.set(state.accountsInfo[chainId], info.account, {
          type: info && info.type || null,
          group: null,
          name: null,
          mine: info.account == store.getters['connection/coinbase'],
          sync: info.account == store.getters['connection/coinbase'],
          report: info.account == store.getters['connection/coinbase'],
          junk: false,
          tags: [],
          notes: null,
        });
      }
    },
    addNewAccount(state, info) {
      logInfo("dataModule", "mutations.addNewAccount(" + JSON.stringify(info) + ")");
      const [block, chainId] = [store.getters['connection/block'], store.getters['connection/chainId']];
      if (!(chainId in state.accounts)) {
        Vue.set(state.accounts, chainId, {});
      }
      if (!(info.account in state.accounts[chainId])) {
        Vue.set(state.accounts[chainId], info.account, {
          type: info && info.type || null,
          name: info && info.name || null,
          symbol: info && info.symbol || null,
          decimals: info && info.decimals || null,
          collection: info && info.collection || {},
          balances: info && info.balances || {},
          created: {
            timestamp: block && block.timestamp || null,
            blockNumber: block && block.number || null,
          },
          transactions: {},
          internalTransactions: {},
          events: {},
          assets: {},
          erc20transfers: {},
          updated: {
            timestamp: null,
            blockNumber: null,
          },
        });
      }
    },
    addAccountEvent(state, info) {
      const [account, eventRecord, chainId] = [info.account, info.eventRecord, store.getters['connection/chainId']];
      const accountData = state.accounts[chainId][account];
      if (!(eventRecord.txHash in accountData.events)) {
        accountData.events[eventRecord.txHash] = {};
      }
      const tempEvent = { ...eventRecord, txHash: undefined, logIndex: undefined };
      accountData.events[eventRecord.txHash][eventRecord.logIndex] = tempEvent;
    },
    addAccountInternalTransactions(state, info) {
      const [account, results, chainId] = [info.account, info.results, store.getters['connection/chainId']];
      const accountData = state.accounts[chainId][account];
      const groupByHashes = {};
      for (const result of results) {
        if (!(result.hash in accountData.internalTransactions)) {
          if (!(result.hash in groupByHashes)) {
            groupByHashes[result.hash] = [];
          }
          groupByHashes[result.hash].push(result);
        }
      }
      for (const [txHash, results] of Object.entries(groupByHashes)) {
        for (let resultIndex in results) {
          const result = results[resultIndex];
          if (!(txHash in accountData.internalTransactions)) {
            accountData.internalTransactions[txHash] = {};
          }
          const tempResult = { ...result, hash: undefined };
          accountData.internalTransactions[txHash][resultIndex] = tempResult;
        }
      }
    },
    addAccountTransactions(state, info) {
      const [account, results, chainId] = [info.account, info.results, store.getters['connection/chainId']];
      const accountData = state.accounts[chainId][account];
      for (const result of results) {
        // console.log("addAccountTransactions: " + JSON.stringify(result));
        if (!(result.hash in accountData.transactions)) {
          const tempResult = {...result, processed: null};
          delete tempResult.hash;
          accountData.transactions[result.hash] = tempResult;
          // console.log("addAccountTransactions: " + JSON.stringify(accountData.transactions[result.hash]));
        }
      }
    },
    updateAccountTimestampAndBlock(state, info) {
      const [account, events, chainId] = [info.account, info.events, store.getters['connection/chainId']];
      Vue.set(state.accounts[chainId][account], 'updated', {
        timestamp: info.timestamp,
        blockNumber: info.blockNumber,
      });
    },
    addAccountToken(state, token) {
      const chainId = store.getters['connection/chainId'];
      const contract = ethers.utils.getAddress(token.contract);
      const contractData = state.accounts[chainId][contract];
      if (!(token.tokenId in contractData.assets)) {
        Vue.set(state.accounts[chainId][contract].assets, token.tokenId, {
          name: token.name,
          description: token.description,
          image: token.image,
          type: token.kind,
          isFlagged: token.isFlagged,
          events: {},
        });
        // console.log("Added token: " + contract + ":" + token.tokenId + " => " + JSON.stringify(state.accounts[chainId][contract].assets[token.tokenId]));
      }
    },
    addAccountERC20Transfers(state, transfer) {
      // console.log("addAccountERC20Transfers: " + JSON.stringify(transfer));
      const chainId = store.getters['connection/chainId'];
      const contract = ethers.utils.getAddress(transfer.contract);
      const contractData = state.accounts[chainId][contract];
      if (!(transfer.txHash in contractData.erc20transfers)) {
        Vue.set(state.accounts[chainId][contract].erc20transfers, transfer.txHash, {});
      }
      if (!(transfer.logIndex in state.accounts[chainId][contract].erc20transfers[transfer.txHash])) {
        const tempTransfer = {...transfer};
        delete tempTransfer.txHash;
        delete tempTransfer.logIndex;
        Vue.set(state.accounts[chainId][contract].erc20transfers[transfer.txHash], transfer.logIndex, tempTransfer);
      }
      // console.log("Added " + transfer.txHash + " " + JSON.stringify(state.accounts[chainId][contract].erc20transfers[transfer.txHash]));
    },
    addAccountTokenEvent(state, event) {
      // console.log("addAccountTokenEvent: " + JSON.stringify(event));
      const chainId = store.getters['connection/chainId'];
      const contractData = state.accounts[chainId][event.contract];
      const asset = contractData.assets[event.tokenId];
      // console.log("  asset: " + JSON.stringify(asset));
      if (!(event.txHash in asset.events)) {
        Vue.set(state.accounts[chainId][event.contract].assets[event.tokenId].events, event.txHash, {});
      }
      if (!(event.logIndex in asset.events[event.txHash])) {
        Vue.set(state.accounts[chainId][event.contract].assets[event.tokenId].events[event.txHash], event.logIndex, {
          blockNumber: event.blockNumber,
          timestamp: event.timestamp,
          from: event.from,
          to: event.to,
          value: event.value && event.value || null,
        });
        // console.log("Added event: " + JSON.stringify(state.accounts[chainId][event.contract].assets[event.tokenId], null, 2));
      }
    },
    addBlock(state, info) {
      const [chainId, blockNumber, timestamp, account, balance] = [store.getters['connection/chainId'], info.blockNumber, info.timestamp, info.account, info.balance];
      if (!(chainId in state.blocks)) {
        Vue.set(state.blocks, chainId, {});
      }
      if (!(blockNumber in state.blocks[chainId])) {
        Vue.set(state.blocks[chainId], blockNumber, {
          timestamp,
          balances: {},
        });
      }
      if (!(account in state.blocks[chainId][blockNumber].balances)) {
        Vue.set(state.blocks[chainId][blockNumber].balances, account, balance);
      }
    },
    addNewFunctionSelectors(state, functionSelectors) {
      console.log("addNewFunctionSelectors: " + JSON.stringify(functionSelectors));
      for (const [functionSelector, functionNames] of Object.entries(functionSelectors)) {
        // console.log(functionSelector + " " + JSON.stringify(functionNames));
        if (!(functionSelector in state.functionSelectors)) {
          Vue.set(state.functionSelectors, functionSelector, functionNames.map(e => e.name));
        }
      }
      // console.log("state.functionSelectors: " + JSON.stringify(state.functionSelectors));
    },
    addNewEventSelectors(state, eventSelectors) {
      console.log("addNewEventSelectors: " + JSON.stringify(eventSelectors));
      for (const [eventSelector, eventNames] of Object.entries(eventSelectors)) {
        // console.log(eventSelector + " " + JSON.stringify(eventNames));
        if (!(eventSelector in state.eventSelectors)) {
          Vue.set(state.eventSelectors, eventSelector, eventNames.map(e => e.name));
        }
      }
      // console.log("state.eventSelectors: " + JSON.stringify(state.eventSelectors));
    },
    addENSName(state, nameInfo) {
      Vue.set(state.ensMap, nameInfo.account, nameInfo.name);
    },
    addTxs(state, info) {
      const [chainId, txInfo] = [info.chainId, info.txInfo];
      if (!(chainId in state.txs)) {
        Vue.set(state.txs, chainId, {});
      }
      Vue.set(state.txs[chainId], txInfo.tx.hash, txInfo);
    },
    addNewSignatures(state, newSignatures) {
      // console.log("addNewSignatures: " + JSON.stringify(newSignatures));
      for (const [methodId, signatures] of Object.entries(newSignatures.functionSignatures)) {
        // console.log(methodId + " => " + JSON.stringify(signatures));
        // TODO: Merge new array with old array
        if (!(methodId in state.signatures.functionSignatures)) {
          Vue.set(state.signatures.functionSignatures, methodId, signatures);
          // console.log("state.signatures.functionSignatures: " + JSON.stringify(state.signatures.functionSignatures));
        }
      }
    },
    updateTxData(state, info) {
      // logInfo("dataModule", "mutations.updateTxData - info: " + JSON.stringify(info).substring(0, 1000));
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
    setExchangeRates(state, exchangeRates) {
      // const dates = Object.keys(exchangeRates);
      // dates.sort();
      // for (let date of dates) {
      //   console.log(date + "\t" + exchangeRates[date]);
      // }
      Vue.set(state, 'exchangeRates', exchangeRates);
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
      if (Object.keys(context.state.txs) == 0) {
        const db0 = new Dexie(context.state.db.name);
        db0.version(context.state.db.version).stores(context.state.db.schemaDefinition);
        for (let type of ['accounts', 'accountsInfo', 'txs', 'txsInfo', 'blocks', 'functionSelectors', 'eventSelectors', 'ensMap', 'assets', 'exchangeRates']) {
          const data = await db0.cache.where("objectName").equals(type).toArray();
          if (data.length == 1) {
            context.commit('setState', { name: type, data: data[0].object });
          }
        }
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
    async toggleAccountInfoField(context, info) {
      context.commit('toggleAccountInfoField', info);
      context.dispatch('saveData', ['accounts', 'accountsInfo']);
    },
    async setAccountInfoField(context, info) {
      context.commit('setAccountInfoField', info);
      context.dispatch('saveData', ['accounts', 'accountsInfo']);
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
          context.commit('addNewAccountInfo', accountInfo);
          context.commit('addNewAccount', accountInfo);
        }
        const names = await ensReverseRecordsContract.getNames([account]);
        const name = names.length == 1 ? names[0] : account;
        if (!(account in context.state.ensMap)) {
          context.commit('addENSName', { account, name });
        }
      }
      context.dispatch('saveData', ['accountsInfo', 'accounts', 'ensMap']);
    },
    async syncIt(context, info) {
      const sections = info.sections;
      const parameters = info.parameters || [];
      logInfo("dataModule", "actions.syncIt - sections: " + JSON.stringify(sections) + ", parameters: " + JSON.stringify(parameters).substring(0, 1000));
      const chainId = store.getters['connection/chainId'];
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const ensReverseRecordsContract = new ethers.Contract(ENSREVERSERECORDSADDRESS, ENSREVERSERECORDSABI, provider);
      const etherscanAPIKey = store.getters['config/settings'].etherscanAPIKey && store.getters['config/settings'].etherscanAPIKey.length > 0 && store.getters['config/settings'].etherscanAPIKey || "YourApiKeyToken";
      const etherscanBatchSize = store.getters['config/settings'].etherscanBatchSize && parseInt(store.getters['config/settings'].etherscanBatchSize) || 5_000_000;
      const confirmations = store.getters['config/settings'].confirmations && parseInt(store.getters['config/settings'].confirmations) || 10;
      const reportingCurrency = store.getters['config/settings'].reportingCurrency;
      const devSettings = store.getters['config/devSettings'];
      const preERC721s = store.getters['config/settings'].preERC721s;
      const interfaces = getInterfaces();
      const block = await provider.getBlock();
      const confirmedBlockNumber = block && block.number && (block.number - confirmations) || null;
      const confirmedBlock = await provider.getBlock(confirmedBlockNumber);
      const confirmedTimestamp = confirmedBlock && confirmedBlock.timestamp || null;
      const OVERLAPBLOCKS = 10000;

      context.commit('setSyncHalt', false);
      for (let section of sections) {
        if (section == 'importFromEtherscan') {
          const accountsToSync = [];
          const accountsData = context.state.accounts[chainId] || {};
          for (const [account, accountData] of Object.entries(accountsData)) {
            const accountsInfo = context.state.accountsInfo[chainId][account];
            if ((parameters.length == 0 && accountsInfo.sync) || parameters.includes(account)) {
                accountsToSync.push(account);
            }
          }
          console.log("importFromEtherscan - accountsToSync: " + JSON.stringify(accountsToSync));

          let sleepUntil = null;
          for (const [accountIndex, account] of accountsToSync.entries()) {
            context.commit('setSyncSection', { section: 'Import', total: accountsToSync.length });
            const accountData = context.state.accounts[chainId][account] || {};
            context.commit('setSyncCompleted', parseInt(accountIndex) + 1);
            console.log("--- Syncing " + account + " --- ");
            // console.log("accountData: " + JSON.stringify(accountData, null, 2).substring(0, 1000) + "...");
            const startBlock = accountData && accountData.updated && accountData.updated.blockNumber && (parseInt(accountData.updated.blockNumber) - OVERLAPBLOCKS) || 0;

            context.commit('setSyncSection', { section: 'Web3 Events', total: accountsToSync.length });
            for (let startBatch = startBlock; startBatch < confirmedBlockNumber; startBatch += etherscanBatchSize) {
              const endBatch = (parseInt(startBatch) + etherscanBatchSize < confirmedBlockNumber) ? (parseInt(startBatch) + etherscanBatchSize) : confirmedBlockNumber;
              const topicsList = [
                [
                  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer (index_topic_1 address from, index_topic_2 address to, index_topic_3 uint256 id)
                  '0x000000000000000000000000' + account.substring(2, 42).toLowerCase(),
                  null,
                ],
                [
                  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer (index_topic_1 address from, index_topic_2 address to, index_topic_3 uint256 id)
                  null,
                  '0x000000000000000000000000' + account.substring(2, 42).toLowerCase(),
                ],
                [
                  '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62', // ERC-1155 TransferSingle (index_topic_1 address _operator, index_topic_2 address _from, index_topic_3 address _to, uint256 _id, uint256 _value)
                  null,
                  '0x000000000000000000000000' + account.substring(2, 42).toLowerCase(),
                  null,
                ],
                [
                  '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62', // ERC-1155 TransferSingle (index_topic_1 address _operator, index_topic_2 address _from, index_topic_3 address _to, uint256 _id, uint256 _value)
                  null,
                  null,
                  '0x000000000000000000000000' + account.substring(2, 42).toLowerCase(),
                ],
                [
                  '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb', // ERC-1155 TransferBatch (index_topic_1 address operator, index_topic_2 address from, index_topic_3 address to, uint256[] ids, uint256[] values)
                  null,
                  '0x000000000000000000000000' + account.substring(2, 42).toLowerCase(),
                  null,
                ],
                [
                  '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb', // ERC-1155 TransferBatch (index_topic_1 address operator, index_topic_2 address from, index_topic_3 address to, uint256[] ids, uint256[] values)
                  null,
                  null,
                  '0x000000000000000000000000' + account.substring(2, 42).toLowerCase(),
                ],
              ];
              for (let topics of topicsList) {
                console.log("Web3 filter: " + JSON.stringify(topics));
                const logs = await provider.getLogs({ address: null, fromBlock: startBatch, toBlock: endBatch, topics });
                for (const event of logs) {
                  if (!event.removed) {
                    let eventRecord = null;
                    const [txHash, blockNumber, logIndex, contract]  = [event.transactionHash, event.blockNumber, event.logIndex, event.address];
                    if (event.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                      let from;
                      let to;
                      let tokensOrTokenId;
                      if (event.topics.length == 4) {
                        from = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
                        to = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
                        tokensOrTokenId = ethers.BigNumber.from(event.topics[3]).toString();
                      } else if (event.topics.length == 3) {
                        from = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
                        to = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
                        tokensOrTokenId = ethers.BigNumber.from(event.data).toString();
                      } else if (event.topics.length == 1) {
                        from = ethers.utils.getAddress('0x' + event.data.substring(26, 66));
                        to = ethers.utils.getAddress('0x' + event.data.substring(90, 130));
                        tokensOrTokenId = ethers.BigNumber.from('0x' + event.data.substring(130, 193)).toString();
                      }
                      if ((from == account || to == account)) {
                        // ERC-721 Transfer, including pre-ERC721s like CryptoPunks, MoonCatRescue, CryptoCats, CryptoVoxels & CryptoKitties
                        if (event.topics.length == 4 || event.address in preERC721s) {
                          if (event.address in preERC721s) {
                            eventRecord = { txHash, blockNumber, logIndex, contract, from, to, type: "preerc721", tokenId: null, tokens: tokensOrTokenId };
                          } else {
                            eventRecord = { txHash, blockNumber, logIndex, contract, from, to, type: "erc721", tokenId: tokensOrTokenId, tokens: null };
                          }
                        } else {
                          eventRecord = { txHash, blockNumber, logIndex, contract, from, to, type: "erc20", tokenId: null, tokens:tokensOrTokenId };
                        }
                      }
                      // ERC-1155 TransferSingle (index_topic_1 address _operator, index_topic_2 address _from, index_topic_3 address _to, uint256 _id, uint256 _value)
                    } else if (event.topics[0] == "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62") {
                      const log = interfaces.erc1155.parseLog(event);
                      const [operator, from, to, tokenId, tokens] = log.args;
                      eventRecord = { txHash, blockNumber, logIndex, contract, from, to, type: "erc1155", tokenIds: [ethers.BigNumber.from(tokenId).toString()], tokens: [ethers.BigNumber.from(tokens).toString()] };
                      // ERC-1155 TransferBatch (index_topic_1 address operator, index_topic_2 address from, index_topic_3 address to, uint256[] ids, uint256[] values)
                    } else if (event.topics[0] == "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb") {
                      const log = interfaces.erc1155.parseLog(event);
                      const [operator, from, to, tokenIds, tokens] = log.args;
                      const formattedTokenIds = tokenIds.map(e => ethers.BigNumber.from(e).toString());
                      const formattedTokens = tokens.map(e => ethers.BigNumber.from(e).toString());
                      eventRecord = { txHash, blockNumber, logIndex, contract, from, to, type: "erc1155", tokenIds: formattedTokenIds, tokens: formattedTokens };
                    }
                    if (eventRecord) {
                      console.log("eventRecord: " + JSON.stringify(eventRecord));
                      context.commit('addAccountEvent', { account, eventRecord });
                    }
                  }
                }
              }
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
                context.commit('addAccountInternalTransactions', { account, results: importData.result });
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
                context.commit('addAccountTransactions', { account, results: importData.result });
                if (importData.message && importData.message.includes("Missing")) {
                  sleepUntil = parseInt(moment().unix()) + 6;
                }
                if (context.state.sync.halt) {
                  break;
                }
              }
            }
            context.commit('updateAccountTimestampAndBlock', { chainId, account, timestamp: confirmedTimestamp, blockNumber: confirmedBlockNumber });
          }
          console.log("accounts: " + JSON.stringify(context.state.accounts[chainId], null, 2));
          context.dispatch('saveData', ['accounts', 'accountsInfo', 'txs', 'ensMap']);
          context.commit('setSyncSection', { section: null, total: null });

        } else if (section == 'downloadData') {
          const accountsToSync = [];
          const accountsData = context.state.accounts[chainId] || {};
          for (const [account, data] of Object.entries(accountsData)) {
            console.log("account: " + account);
            // TODO
            // if ((parameters.length == 0 && data.sync) || parameters.includes(account)) {
                accountsToSync.push(account);
            // }
          }
          console.log("accountsToSync: " + JSON.stringify(accountsToSync));

          let sleepUntil = null;
          for (const [accountIndex, account] of accountsToSync.entries()) {
            // context.commit('setSyncSection', { section: ' Import', total: accountKeysToSync.length });
            const item = context.state.accounts[chainId][account] || {};
            const txs = context.state.txs[chainId] || {};
            // context.commit('setSyncCompleted', parseInt(keyIndex) + 1);
            console.log("--- Downloading for " + account + " --- ");
            console.log("item: " + JSON.stringify(item, null, 2).substring(0, 1000) + "...");

            const txHashesByBlocks = getTxHashesByBlocks(account, chainId, context.state.accounts, context.state.accountsInfo);
            if (true) {
              console.log("txHashesByBlocks: " + JSON.stringify(txHashesByBlocks, null, 2));
              const blockNumbers = [];
              for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
                const existing = context.state.blocks[chainId] && context.state.blocks[chainId][blockNumber] && context.state.blocks[chainId][blockNumber].balances[account] || null;
                if (!existing) {
                  blockNumbers.push(blockNumber);
                }
              }
              context.commit('setSyncSection', { section: 'Blocks & Balances', total: blockNumbers.length });
              for (const [index, blockNumber] of blockNumbers.entries()) {
                const existing = context.state.blocks[chainId] && context.state.blocks[chainId][blockNumber] && context.state.blocks[chainId][blockNumber].balances[account] || null;
                if (!existing) {
                  console.log((parseInt(index) + 1) + "/" + blockNumbers.length + " Timestamp & Balance: " + blockNumber);
                  const block = await provider.getBlock(parseInt(blockNumber));
                  const timestamp = block.timestamp;
                  const balance = ethers.BigNumber.from(await provider.getBalance(account, parseInt(blockNumber))).toString();
                  context.commit('addBlock', { blockNumber, timestamp, account, balance });
                  context.commit('setSyncCompleted', parseInt(index) + 1);
                  if ((index + 1) % 100 == 0) {
                    console.log("Saving blocks");
                    context.dispatch('saveData', ['blocks']);
                  }
                }
                if (context.state.sync.halt) {
                  break;
                }
              }
              context.dispatch('saveData', ['blocks']);
              context.commit('setSyncSection', { section: null, total: null });
            }

            if (true) {
              const txHashes = {};
              for (const [txHash, logIndexes] of Object.entries(item.events)) {
                if (!(txHash in txs) && !(txHash in txHashes)) {
                  for (const [logIndex, event] of Object.entries(logIndexes)) {
                    txHashes[txHash] = event.blockNumber;
                  }
                }
              }
              for (const [txHash, traceIds] of Object.entries(item.internalTransactions)) {
                if (!(txHash in txs) && !(txHash in txHashes)) {
                  for (const [traceId, tx] of Object.entries(traceIds)) {
                    txHashes[txHash] = tx.blockNumber;
                  }
                }
              }
              for (const [txHash, tx] of Object.entries(item.transactions)) {
                if (!(txHash in txs) && !(txHash in txHashes)) {
                  txHashes[txHash] = tx.blockNumber;
                }
              }
              let txHashList = [];
              for (const [txHash, blockNumber] of Object.entries(txHashes)) {
                txHashList.push({ txHash, blockNumber });
              }
              txHashList.sort((a, b) => a.blockNumber - b.blockNumber);
              txHashList = txHashList.slice(devSettings.skipBlocks, parseInt(devSettings.maxBlocks) + 1);
              console.log("txHashList: " + JSON.stringify(txHashList));
              context.commit('setSyncSection', { section: 'Tx & TxReceipts', total: txHashList.length });
              for (const [txItemIndex, txItem] of txHashList.entries()) {
                context.commit('setSyncCompleted', parseInt(txItemIndex) + 1);
                console.log((parseInt(txItemIndex) + 1) + "/" + txHashList.length + " Retrieving " + txItem.txHash + " @ " + txItem.blockNumber);
                const currentInfo = txs && txs[txItem.txHash] || {};
                const [info, newSignatures] = await getTxInfo(txItem.txHash, currentInfo, account, provider, context.state.signatures);
                context.commit('addTxs', { chainId, txInfo: info});
                context.commit('addNewSignatures', newSignatures);
                if ((txItemIndex + 1) % 100 == 0) {
                  console.log("Saving txs");
                  context.dispatch('saveData', ['txs']);
                }
                if (context.state.sync.halt) {
                  break;
                }
              }
              // context.dispatch('saveData', ['accounts', 'txs', 'ensMap']);
              context.dispatch('saveData', ['txs']);
            }

            if (true) {
              // console.log("txHashesByBlocks: " + JSON.stringify(txHashesByBlocks, null, 2));
              const missingSelectorsMap = {};
              const functionSelectors = context.state.functionSelectors || {};
              let blocksProcessed = 0;
              for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
                if (blocksProcessed >= devSettings.skipBlocks && blocksProcessed < devSettings.maxBlocks) {
                  const block = context.state.blocks[chainId] && context.state.blocks[chainId][blockNumber] || null;
                  for (const [index, txHash] of Object.keys(txHashes).entries()) {
                    const txInfo = txs && txs[txHash] || {};
                    if (txInfo.tx && txInfo.tx.to != null && txInfo.tx.data.length > 9) {
                      const selector = txInfo.tx.data.substring(0, 10);
                      if (!(selector in functionSelectors) && !(selector in missingSelectorsMap)) {
                        missingSelectorsMap[selector] = true;
                      }
                    }
                  }
                }
                blocksProcessed++;
              }
              const missingSelectors = Object.keys(missingSelectorsMap);
              const BATCHSIZE = 50;
              for (let i = 0; i < missingSelectors.length; i += BATCHSIZE) {
                const batch = missingSelectors.slice(i, parseInt(i) + BATCHSIZE);
                let url = "https://sig.eth.samczsun.com/api/v1/signatures?" + batch.map(e => ("function=" + e)).join("&");
                console.log(url);
                const data = await fetch(url)
                  .then(response => response.json())
                  .catch(function(e) {
                    console.log("error: " + e);
                  });
                if (data.ok && Object.keys(data.result.function).length > 0) {
                  context.commit('addNewFunctionSelectors', data.result.function);
                }
              }
              context.dispatch('saveData', ['functionSelectors']);
            }

            if (true) {
              // console.log("txHashesByBlocks: " + JSON.stringify(txHashesByBlocks, null, 2));
              const missingSelectorsMap = {};
              const eventSelectors = context.state.eventSelectors || {};
              let blocksProcessed = 0;
              for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
                if (blocksProcessed >= devSettings.skipBlocks && blocksProcessed < devSettings.maxBlocks) {
                  const block = context.state.blocks[chainId] && context.state.blocks[chainId][blockNumber] || null;
                  for (const [index, txHash] of Object.keys(txHashes).entries()) {
                    const txInfo = txs && txs[txHash] || {};
                    if ('txReceipt' in txInfo) {
                      for (const event of txInfo.txReceipt.logs) {
                        if (!(event.topics[0] in eventSelectors) && !(event.topics[0] in missingSelectorsMap)) {
                          missingSelectorsMap[event.topics[0]] = true;
                        }
                      }
                    }
                  }
                }
                blocksProcessed++;
              }
              const missingSelectors = Object.keys(missingSelectorsMap);
              console.log(JSON.stringify(missingSelectors));
              const BATCHSIZE = 50;
              for (let i = 0; i < missingSelectors.length; i += BATCHSIZE) {
                const batch = missingSelectors.slice(i, parseInt(i) + BATCHSIZE);
                let url = "https://sig.eth.samczsun.com/api/v1/signatures?" + batch.map(e => ("event=" + e)).join("&");
                console.log(url);
                const data = await fetch(url)
                  .then(response => response.json())
                  .catch(function(e) {
                    console.log("error: " + e);
                  });
                if (data.ok && Object.keys(data.result.event).length > 0) {
                  context.commit('addNewEventSelectors', data.result.event);
                }
              }
              context.dispatch('saveData', ['eventSelectors']);
            }

            if (context.state.sync.halt) {
              break;
            }
          }


          // TODO
          // Build ERC-721 and ERC-1155 assets (contracts + tokens), plus ERC-20 contracts
        } else if (section == 'buildAssets') {
          const accountsToSync = [];
          const accountsData = context.state.accounts[chainId] || {};
          for (const [account, data] of Object.entries(accountsData)) {
            if ((parameters.length == 0 && data.sync) || parameters.includes(account)) {
                accountsToSync.push(account);
            }
          }
          console.log("buildAssets - accountsToSync: " + JSON.stringify(accountsToSync));
          for (const accountIndex in accountsToSync) {
            context.commit('setSyncSection', { section: 'Build assets', total: null });
            const account = accountsToSync[accountIndex];
            const item = context.state.accounts[chainId][account];
            context.commit('setSyncCompleted', 1);
            console.log("--- Building assets for " + account + " --- ");
            console.log("item: " + JSON.stringify(item, null, 2).substring(0, 200) + "...");

            // -- Create list of ERC-20, ERC-721 & ERC-1155 events
            const events = [];
            for (const [txHash, logIndexes] of Object.entries(item.events)) {
              if (txHash in context.state.txs[chainId]) {
                const txItem = context.state.txs[chainId][txHash];
                const blockNumber = txItem.tx.blockNumber;
                const timestamp = txItem.timestamp;
                for (const [logIndex, event] of Object.entries(logIndexes)) {
                  events.push({ txHash, logIndex, ...event });
                }
              }
            }
            // console.log("events: " + JSON.stringify(events, null, 2));

            // Create ERC-721, ERC-1155 and ERC-20 contracts
            const contractsToCreateMap = {};
            for (let event of events) {
              if (!(event.contract in context.state.accounts[chainId]) && !(event.contract in contractsToCreateMap)) {
                contractsToCreateMap[event.contract] = true;
              }
            }
            const contractsToCreate = Object.keys(contractsToCreateMap);
            context.commit('setSyncSection', { section: 'Build Contracts', total: contractsToCreate.length });
            for (let contractsToCreateIndex in contractsToCreate) {
              const contractToCreate = contractsToCreate[contractsToCreateIndex];
              context.commit('setSyncCompleted', parseInt(contractsToCreateIndex) + 1);
              const accountInfo = await getAccountInfo(contractToCreate, provider)
              if (accountInfo.account) {
                context.commit('addNewAccountInfo', accountInfo);
                context.commit('addNewAccount', accountInfo);
                console.log("Added contractToCreate: " + contractToCreate + " " + accountInfo.type + " " + accountInfo.name);
              }
              if (context.state.sync.halt) {
                break;
              }
            }

            // TODO ERC-20 transactions
            // Create ERC-721, ERC-1155 tokens
            const tokenIdsToCreateMap = {};
            for (let event of events) {
              const contractData = context.state.accounts[chainId][event.contract] || null;
              if (contractData) {
                if (contractData.type != event.type) {
                  // TODO
                  // console.log("TODO contractData: " + JSON.stringify(contractData));
                  // console.log("         vs event: " + JSON.stringify(event));
                } else {
                  const assets = contractData.assets;
                  if (event.type == 'erc721' || event.type == 'erc1155') {
                    const key = event.contract + ':' + event.tokenId;
                    if (!(event.tokenId in assets) && !(key in tokenIdsToCreateMap)) {
                      tokenIdsToCreateMap[key] = true;
                    // } else {
                      // console.log("Found " + JSON.stringify(assets[event.tokenId]));
                    }
                  }
                }
              }
            }
            const tokenIdsToCreate = Object.keys(tokenIdsToCreateMap);
            console.log("tokenIdsToCreate: " + JSON.stringify(tokenIdsToCreate, null, 2));
            context.commit('setSyncSection', { section: 'Build Tokens', total: tokenIdsToCreate.length });

            const GETTOKENINFOBATCHSIZE = 50;
            const info = {};
            const DELAYINMILLIS = 2000;
            for (let i = 0; i < tokenIdsToCreate.length && !context.state.sync.halt; i += GETTOKENINFOBATCHSIZE) {
              const batch = tokenIdsToCreate.slice(i, parseInt(i) + GETTOKENINFOBATCHSIZE);
              let continuation = null;
              do {
                let url = "https://api.reservoir.tools/tokens/v5?";
                let separator = "";
                for (let j = 0; j < batch.length; j++) {
                  url = url + separator + "tokens=" + batch[j];
                  separator = "&";
                }
                url = url + (continuation != null ? "&continuation=" + continuation : '');
                url = url + "&limit=50";
                console.log(url);
                const data = await fetch(url).then(response => response.json());
                context.commit('setSyncCompleted', parseInt(i) + batch.length);
                continuation = data.continuation;
                if (data.tokens) {
                  for (let record of data.tokens) {
                    context.commit('addAccountToken', record.token);
                  }
                }
                await delay(DELAYINMILLIS);
              } while (continuation != null);
            }

            for (let event of events) {
              const contractData = context.state.accounts[chainId][event.contract] || null;
              if (contractData) {
                if (contractData.type != event.type) {
                  // TODO
                  console.log("TODO contractData: " + JSON.stringify(contractData));
                  console.log("         vs event: " + JSON.stringify(event));
                } else {
                  const assets = contractData.assets;
                  if (event.type == 'erc721' || event.type == 'erc1155') {
                    if (event.tokenId in assets) {
                      const token = assets[event.tokenId];
                      const tokenEvents = token.events;
                      if (!token.events[event.txHash] || !token.events[event.txHash][event.logIndex]) {
                        context.commit('addAccountTokenEvent', event);
                      }
                    }
                  }
                }
              }
              if (context.state.sync.halt) {
                break;
              }
            }

            if (context.state.sync.halt) {
              break;
            }
          }
          context.dispatch('saveData', ['accounts', 'accountsInfo']);
          console.log("accounts: " + JSON.stringify(context.state.accounts[chainId], null, 2));
          console.log("accountsInfo: " + JSON.stringify(context.state.accountsInfo[chainId], null, 2));
          context.commit('setSyncSection', { section: null, total: null });
          console.log("end buildAssets - accountsToSync: " + JSON.stringify(accountsToSync));

        } else if (section == 'buildERC20sx') {
          const accountsToSync = [];
          const accountsData = context.state.accounts[chainId] || {};
          for (const [account, data] of Object.entries(accountsData)) {
            if ((parameters.length == 0 && data.sync) || parameters.includes(account)) {
                accountsToSync.push(account);
            }
          }
          console.log("buildERC20s - accountsToSync: " + JSON.stringify(accountsToSync));
          for (const accountIndex in accountsToSync) {
            context.commit('setSyncSection', { section: 'Build ERC20s', total: null });
            const account = accountsToSync[accountIndex];
            const item = context.state.accounts[chainId][account];
            context.commit('setSyncCompleted', 1);
            console.log("--- Building ERC20s for " + account + " --- ");
            console.log("item: " + JSON.stringify(item, null, 2).substring(0, 200) + "...");
            // -- Create list of ERC-20 events
            const events = [];
            for (const [txHash, logIndexes] of Object.entries(item.events)) {
              if (txHash in context.state.txs[chainId]) {
                const txItem = context.state.txs[chainId][txHash];
                const blockNumber = txItem.tx.blockNumber;
                const timestamp = txItem.timestamp;
                for (const [logIndex, event] of Object.entries(logIndexes)) {
                  if (!event.processed) {
                    let eventRecord = null;
                    const contract = event.address;
                    if (event.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                      const from = ethers.utils.getAddress("0x" + event.topics[1].substring(26));
                      const to = ethers.utils.getAddress("0x" + event.topics[2].substring(26));
                      if ((from == account || to == account)) {
                        // ERC-20 Transfer
                        if (event.topics.length == 3) {
                          const tokens = ethers.BigNumber.from(event.data).toString();
                          eventRecord = { txHash, blockNumber, timestamp, logIndex, contract, from, to, tokens, type: event.type };
                        }
                      }
                    }
                    if (eventRecord != null) {
                      events.push(eventRecord);
                    } else {
                      if (event.type != 'erc721' && event.type != 'erc1155') {
                        console.log("NOT PROCESSED: " + event.type + " contract: " + contract + " " + txHash + " " + JSON.stringify(event));
                      }
                    }
                  }
                }
              }
            }
            // console.log("events: " + JSON.stringify(events, null, 2));

            for (let event of events) {
              const contractData = context.state.accounts[chainId][event.contract] || null;
              if (contractData) {
                if (contractData.type != event.type) {
                  // TODO
                  // console.log("TODO contractData: " + JSON.stringify(contractData));
                  // console.log("         vs event: " + JSON.stringify(event));
                } else {
                  const transfer = event;
                  const erc20transfers = contractData.erc20transfers;
                  if (!(transfer.txHash in erc20transfers) || !(transfer.logIndex in erc20transfers[transfer.txHash])) {
                    const erc20 = new ethers.Contract(transfer.contract, ERC20ABI, provider);
                    let fromBalance = 0;
                    try {
                      fromBalance = await erc20.balanceOf(transfer.from, { blockTag: transfer.blockNumber });
                    } catch (e) {
                    }
                    let toBalance = 0;
                    try {
                      toBalance = await erc20.balanceOf(transfer.to, { blockTag: transfer.blockNumber });
                    } catch (e) {
                    }
                    let fromBalancePrevBlock = 0;
                    try {
                      fromBalancePrevBlock = await erc20.balanceOf(transfer.from, { blockTag: parseInt(transfer.blockNumber) - 1 });
                    } catch (e) {
                    }
                    let toBalancePrevBlock = 0;
                    try {
                      toBalancePrevBlock = await erc20.balanceOf(transfer.to, { blockTag: parseInt(transfer.blockNumber) - 1 });
                    } catch (e) {
                    }
                    // console.log("from prev: " + (fromBalancePrevBlock == null ? 'null' : ethers.BigNumber.from(fromBalancePrevBlock).toString()) + " curr: " + (fromBalance == null ? 'null' : ethers.BigNumber.from(fromBalance).toString()));
                    // console.log("to prev: " + (toBalancePrevBlock == null ? 'null' : ethers.BigNumber.from(toBalancePrevBlock).toString()) + " curr: " + (toBalance == null ? 'null' : ethers.BigNumber.from(toBalance).toString()));
                    transfer.fromBalance = ethers.BigNumber.from(fromBalance).toString();
                    transfer.fromBalancePrevBlock = ethers.BigNumber.from(fromBalancePrevBlock).toString();
                    transfer.toBalance = ethers.BigNumber.from(toBalance).toString();
                    transfer.toBalancePrevBlock = ethers.BigNumber.from(toBalancePrevBlock).toString();
                    context.commit('addAccountERC20Transfers', transfer);
                  }
                }
              }

            }
          }
          context.dispatch('saveData', ['accounts']);
          context.commit('setSyncSection', { section: null, total: null });
          console.log("end buildERC20s - accountsToSync: " + JSON.stringify(accountsToSync));

        } else if (section == 'computeTxsx') {
          console.log("computeTxs");
          context.commit('setSyncSection', { section: 'Compute', total: parameters.length });
          for (let txHashIndex in parameters) {
            const txHash = parameters[txHashIndex];
            const txItem = context.state.txs[chainId][txHash];
            if (txItem) {
              const info = await getTxInfo(txHash, txItem, provider);
              console.log("info: " + JSON.stringify(info, null, 2));
              if (info.summary) {
                context.commit('updateTxData', info);
              }
            }
            context.commit('setSyncCompleted', parseInt(txHashIndex) + 1);
            if (context.state.sync.halt) {
              break;
            }
          }
          context.dispatch('saveData', ['txs']);
          context.commit('setSyncSection', { section: null, total: null });

          // TODO
        } else if (section == 'getExchangeRates') {
          console.log("getExchangeRates: " + reportingCurrency);
          const MAXDAYS = 2000;
          const MINDATE = moment("2015-07-30");
          let toTs = moment();
          const results = {};
          while (toTs.year() >= 2015) {
            let days = toTs.diff(MINDATE, 'days');
            if (days > MAXDAYS) {
              days = MAXDAYS;
            }
            const url = "https://min-api.cryptocompare.com/data/v2/histoday?fsym=ETH&tsym=" + reportingCurrency + "&toTs=" + toTs.unix() + "&limit=" + days;
            console.log(url);
            const data = await fetch(url)
              .then(response => response.json())
              .catch(function(e) {
                console.log("error: " + e);
              });
            for (day of data.Data.Data) {
              results[moment.unix(day.time).format("YYYYMMDD")] = day.close;
            }
            toTs = moment(toTs).subtract(MAXDAYS, 'days');
          }
          context.commit('setExchangeRates', results);
          context.dispatch('saveData', ['exchangeRates']);
          context.commit('setSyncSection', { section: null, total: null });
        }
      }
    },
    // Called by Connection.execWeb3()
    async execWeb3({ state, commit, rootState }, { count, listenersInstalled }) {
      logInfo("dataModule", "execWeb3() start[" + count + ", " + listenersInstalled + ", " + JSON.stringify(rootState.route.params) + "]");
    },
  },
};
