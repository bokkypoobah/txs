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
          accountData.internalTransactions[txHash][resultIndex] = { ...result, hash: undefined };
        }
      }
    },
    addAccountTransactions(state, info) {
      const [account, results, chainId] = [info.account, info.results, store.getters['connection/chainId']];
      const accountData = state.accounts[chainId][account];
      for (const result of results) {
        if (!(result.hash in accountData.transactions)) {
          accountData.transactions[result.hash] = {...result, hash: undefined };
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
      }
    },
    addAccountERC20Transfers(state, transfer) {
      const chainId = store.getters['connection/chainId'];
      const contract = ethers.utils.getAddress(transfer.contract);
      const contractData = state.accounts[chainId][contract];
      if (!(transfer.txHash in contractData.erc20transfers)) {
        Vue.set(state.accounts[chainId][contract].erc20transfers, transfer.txHash, {});
      }
      if (!(transfer.logIndex in state.accounts[chainId][contract].erc20transfers[transfer.txHash])) {
        const tempTransfer = { ...transfer, txHash: undefined, logIndex: undefined };
        Vue.set(state.accounts[chainId][contract].erc20transfers[transfer.txHash], transfer.logIndex, tempTransfer);
      }
    },
    addAccountTokenEvent(state, event) {
      const chainId = store.getters['connection/chainId'];
      const contractData = state.accounts[chainId][event.contract];
      const asset = contractData.assets[event.tokenId];
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
      for (const [functionSelector, functionNames] of Object.entries(functionSelectors)) {
        if (!(functionSelector in state.functionSelectors)) {
          Vue.set(state.functionSelectors, functionSelector, functionNames.map(e => e.name));
        }
      }
    },
    addNewEventSelectors(state, eventSelectors) {
      for (const [eventSelector, eventNames] of Object.entries(eventSelectors)) {
        if (!(eventSelector in state.eventSelectors)) {
          Vue.set(state.eventSelectors, eventSelector, eventNames.map(e => e.name));
        }
      }
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
    updateTxData(state, info) {
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

    // "importFromEtherscan","downloadData","buildAssets","getExchangeRates"
    async syncIt(context, info) {
      // TODO - Replaced below, for dev
      let sections = info.sections;
      const parameters = info.parameters || [];
      logInfo("dataModule", "actions.syncIt - sections: " + JSON.stringify(sections) + ", parameters: " + JSON.stringify(parameters).substring(0, 1000));
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const chainId = store.getters['connection/chainId'];
      const block = await provider.getBlock();
      const confirmations = store.getters['config/settings'].confirmations && parseInt(store.getters['config/settings'].confirmations) || 10;
      const confirmedBlockNumber = block && block.number && (block.number - confirmations) || null;
      const confirmedBlock = await provider.getBlock(confirmedBlockNumber);
      const confirmedTimestamp = confirmedBlock && confirmedBlock.timestamp || null;
      const etherscanAPIKey = store.getters['config/settings'].etherscanAPIKey && store.getters['config/settings'].etherscanAPIKey.length > 0 && store.getters['config/settings'].etherscanAPIKey || "YourApiKeyToken";
      const etherscanBatchSize = store.getters['config/settings'].etherscanBatchSize && parseInt(store.getters['config/settings'].etherscanBatchSize) || 5_000_000;
      const OVERLAPBLOCKS = 10000;
      const devSettings = store.getters['config/devSettings'];
      const accountsByChain = context.state.accounts[chainId] || {};

      const accountsToSync = [];
      for (const [account, accountData] of Object.entries(accountsByChain)) {
        const accountsInfo = context.state.accountsInfo[chainId][account];
        if ((parameters.length == 0 && accountsInfo.sync) || parameters.includes(account)) {
            accountsToSync.push(account);
        }
      }
      // sections = ['syncTransferEvents', 'syncImportInternalTransactions', 'syncImportTransactions', 'scrapeTxs', 'retrieveSelectors', 'buildAssets'];
      // sections = ['all'];
      // sections = ['syncBuildTokenContractsAndAccounts'];
      for (const [sectionIndex, section] of sections.entries()) {
        console.log(sectionIndex + "." + section);
        const parameter = { chainId, accountsToSync, confirmedBlockNumber, confirmedTimestamp, etherscanAPIKey, etherscanBatchSize, OVERLAPBLOCKS, skipBlocks: devSettings.skipBlocks, maxBlocks: devSettings.maxBlocks };
        if (section == "syncTransferEvents" || section == "all") {
          await context.dispatch('syncTransferEvents', parameter);
        }
        if (section == "syncImportInternalTransactions" || section == "all") {
          await context.dispatch('syncImportInternalTransactions', parameter);
        }
        if (section == "syncImportTransactions" || section == "all") {
          await context.dispatch('syncImportTransactions', parameter);
        }
        if (section == "syncBlocksAndBalances" || section == "all") {
          await context.dispatch('syncBlocksAndBalances', parameter);
        }
        if (section == "syncTransactions" || section == "all") {
          await context.dispatch('syncTransactions', parameter);
        }
        if (section == "syncFunctionSelectors" || section == "all") {
          await context.dispatch('syncFunctionSelectors', parameter);
        }
        if (section == "syncEventSelectors" || section == "all") {
          await context.dispatch('syncEventSelectors', parameter);
        }
        if (section == "syncBuildTokenContractsAndAccounts" || section == "all") {
          await context.dispatch('syncBuildTokenContractsAndAccounts', parameter);
        }
        if (section == "syncBuildTokens" || section == "all") {
          await context.dispatch('syncBuildTokens', parameter);
        }
        if (section == "syncBuildTokenEvents" || section == "xall") {
          await context.dispatch('syncBuildTokenEvents', parameter);
        }
        if (section == "syncImportExchangeRates" || section == "all") {
          await context.dispatch('syncImportExchangeRates', parameter);
        }
      }
      context.dispatch('saveData', ['accounts', 'accountsInfo', 'blocks', 'txs', 'ensMap']);
      context.commit('setSyncSection', { section: null, total: null });
      context.commit('setSyncHalt', false);
    },
    async syncTransferEvents(context, parameter) {
      logInfo("dataModule", "actions.syncTransferEvents: " + JSON.stringify(parameter));
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const interfaces = getInterfaces();
      const preERC721s = store.getters['config/settings'].preERC721s;
      for (const [accountIndex, account] of parameter.accountsToSync.entries()) {
        console.log("actions.syncTransferEvents: " + accountIndex + " " + account);
        context.commit('setSyncSection', { section: 'Import', total: parameter.accountsToSync.length });
        context.commit('setSyncCompleted', parseInt(accountIndex) + 1);
        const accountData = context.state.accounts[parameter.chainId][account] || {};
        const startBlock = accountData && accountData.updated && accountData.updated.blockNumber && (parseInt(accountData.updated.blockNumber) - parameter.OVERLAPBLOCKS) || 0;

        context.commit('setSyncSection', { section: 'Transfer Events', total: parameter.accountsToSync.length });
        const accountAs32Bytes = '0x000000000000000000000000' + account.substring(2, 42).toLowerCase();
        for (let startBatch = startBlock; startBatch < parameter.confirmedBlockNumber; startBatch += parameter.etherscanBatchSize) {
          const endBatch = (parseInt(startBatch) + parameter.etherscanBatchSize < parameter.confirmedBlockNumber) ? (parseInt(startBatch) + parameter.etherscanBatchSize) : parameter.confirmedBlockNumber;
          const topicsList = [
            // Transfer (index_topic_1 address from, index_topic_2 address to, index_topic_3 uint256 id)
            [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', accountAs32Bytes, null ],
            [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, accountAs32Bytes ],
            // ERC-1155 TransferSingle (index_topic_1 address _operator, index_topic_2 address _from, index_topic_3 address _to, uint256 _id, uint256 _value)
            [ '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62', null, accountAs32Bytes, null ],
            [ '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62', null, null, accountAs32Bytes ],
            // ERC-1155 TransferBatch (index_topic_1 address operator, index_topic_2 address from, index_topic_3 address to, uint256[] ids, uint256[] values)
            [ '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb', null, accountAs32Bytes, null ],
            [ '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb', null, null, accountAs32Bytes ],
          ];
          for (let topics of topicsList) {
            console.log("Web3 event filter #" + startBatch + "-#" + endBatch + ": " + JSON.stringify(topics));
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
                  context.commit('addAccountEvent', { account, eventRecord });
                }
              }
            }
          }
        }
      }
    },
    async syncImportInternalTransactions(context, parameter) {
      logInfo("dataModule", "actions.syncImportInternalTransactions: " + JSON.stringify(parameter));
      let sleepUntil = null;
      for (const [accountIndex, account] of parameter.accountsToSync.entries()) {
        console.log("actions.syncImportInternalTransactions: " + accountIndex + " " + account);
        context.commit('setSyncSection', { section: 'Etherscan Internal Txs', total: parameter.accountsToSync.length });
        context.commit('setSyncCompleted', parseInt(accountIndex) + 1);
        const accountData = context.state.accounts[parameter.chainId][account] || {};
        const startBlock = accountData && accountData.updated && accountData.updated.blockNumber && (parseInt(accountData.updated.blockNumber) - parameter.OVERLAPBLOCKS) || 0;
        for (let startBatch = startBlock; startBatch < parameter.confirmedBlockNumber; startBatch += parameter.etherscanBatchSize) {
          const endBatch = (parseInt(startBatch) + parameter.etherscanBatchSize < parameter.confirmedBlockNumber) ? (parseInt(startBatch) + parameter.etherscanBatchSize) : parameter.confirmedBlockNumber;
          console.log("batch: " + startBatch + " to " + endBatch + ", sleepUntil: " + (sleepUntil ? moment.unix(sleepUntil).toString() : 'null'));
          do {
          } while (sleepUntil && sleepUntil > moment().unix());
          let importUrl = "https://api.etherscan.io/api?module=account&action=txlistinternal&address=" + account + "&startblock=" + startBatch + "&endblock=" + endBatch + "&page=1&offset=10000&sort=asc&apikey=" + parameter.etherscanAPIKey;
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
      }
    },
    async syncImportTransactions(context, parameter) {
      logInfo("dataModule", "actions.syncImportTransactions: " + JSON.stringify(parameter));
      let sleepUntil = null;
      for (const [accountIndex, account] of parameter.accountsToSync.entries()) {
        console.log("actions.syncImportTransactions: " + accountIndex + " " + account);
        context.commit('setSyncSection', { section: 'Etherscan Transactions', total: parameter.accountsToSync.length });
        context.commit('setSyncCompleted', parseInt(accountIndex) + 1);
        const accountData = context.state.accounts[parameter.chainId][account] || {};
        const startBlock = accountData && accountData.updated && accountData.updated.blockNumber && (parseInt(accountData.updated.blockNumber) - parameter.OVERLAPBLOCKS) || 0;
        for (let startBatch = startBlock; startBatch < parameter.confirmedBlockNumber; startBatch += parameter.etherscanBatchSize) {
          const endBatch = (parseInt(startBatch) + parameter.etherscanBatchSize < parameter.confirmedBlockNumber) ? (parseInt(startBatch) + parameter.etherscanBatchSize) : parameter.confirmedBlockNumber;
          console.log("batch: " + startBatch + " to " + endBatch + ", sleepUntil: " + (sleepUntil ? moment.unix(sleepUntil).toString() : 'null'));
          do {
          } while (sleepUntil && sleepUntil > moment().unix());
          let importUrl = "https://api.etherscan.io/api?module=account&action=txlist&address=" + account + "&startblock=" + startBatch + "&endblock=" + endBatch + "&page=1&offset=10000&sort=asc&apikey=" + parameter.etherscanAPIKey;
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
        // TODO Move elsewhere
        context.commit('updateAccountTimestampAndBlock', { chainId: parameter.chainId, account, timestamp: parameter.confirmedTimestamp, blockNumber: parameter.confirmedBlockNumber });
      }
    },
    async syncBlocksAndBalances(context, parameter) {
      logInfo("dataModule", "actions.syncBlocksAndBalances: " + JSON.stringify(parameter));
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      for (const [accountIndex, account] of parameter.accountsToSync.entries()) {
        console.log("actions.syncBlocksAndBalances: " + accountIndex + " " + account);
        const accountData = context.state.accounts[parameter.chainId][account] || {};
        const txs = context.state.txs[parameter.chainId] || {};
        const txHashesByBlocks = getTxHashesByBlocks(account, parameter.chainId, context.state.accounts, context.state.accountsInfo, parameter.skipBlocks, parameter.maxBlocks);
        if (!context.state.sync.halt) {
          const blockNumbers = [];
          for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
            const existing = context.state.blocks[parameter.chainId] && context.state.blocks[parameter.chainId][blockNumber] && context.state.blocks[parameter.chainId][blockNumber].balances[account] || null;
            if (!existing) {
              blockNumbers.push(blockNumber);
            }
          }
          context.commit('setSyncSection', { section: 'Blocks & Balances', total: blockNumbers.length });
          for (const [index, blockNumber] of blockNumbers.entries()) {
            const existing = context.state.blocks[parameter.chainId] && context.state.blocks[parameter.chainId][blockNumber] && context.state.blocks[parameter.chainId][blockNumber].balances[account] || null;
            if (!existing) {
              const block = await provider.getBlock(parseInt(blockNumber));
              const timestamp = block.timestamp;
              console.log((parseInt(index) + 1) + "/" + blockNumbers.length + " Timestamp & Balance: " + blockNumber + " " + moment.unix(timestamp).format("YYYY-MM-DD HH:mm:ss"));
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
          // context.dispatch('saveData', ['blocks']);
          // context.commit('setSyncSection', { section: null, total: null });
        }
      }
    },
    async syncTransactions(context, parameter) {
      logInfo("dataModule", "actions.syncTransactions: " + JSON.stringify(parameter));
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      for (const [accountIndex, account] of parameter.accountsToSync.entries()) {
        console.log("actions.syncBlocksAndBalances: " + accountIndex + " " + account);
        const accountData = context.state.accounts[parameter.chainId][account] || {};
        const txs = context.state.txs[parameter.chainId] || {};
        const blocks = context.state.blocks;
        const txHashesByBlocks = getTxHashesByBlocks(account, parameter.chainId, context.state.accounts, context.state.accountsInfo, parameter.skipBlocks, parameter.maxBlocks);
        const txHashesToProcess = {};
        if (!context.state.sync.halt) {
          for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
            for (const [index, txHash] of Object.keys(txHashes).entries()) {
              if (!(txHash in txs) && !(txHash in txHashesToProcess)) {
                txHashesToProcess[txHash] = blockNumber;
              }
            }
          }
          let txHashList = Object.keys(txHashesToProcess);
          context.commit('setSyncSection', { section: 'Tx & TxReceipts', total: txHashList.length });
          let processed = 1;

          for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
            const block = blocks[parameter.chainId] && blocks[parameter.chainId][blockNumber] || null;
            for (const [index, txHash] of Object.keys(txHashes).entries()) {
              if (txHash in txHashesToProcess) {
                context.commit('setSyncCompleted', processed);
                console.log(processed + "/" + txHashList.length + " Retrieving " + txHash + " @ " + blockNumber + " " + moment.unix(block.timestamp).format("YYYY-MM-DD HH:mm:ss"));
                const currentInfo = txs && txs[txHash] || {};
                const info = await getTxInfo(txHash, currentInfo, account, provider);
                context.commit('addTxs', { chainId: parameter.chainId, txInfo: info});
                if (processed % 50 == 0) {
                  console.log("Saving txs");
                  context.dispatch('saveData', ['txs']);
                }
                if (context.state.sync.halt) {
                  break;
                }
                processed++;
              }
            }
            if (context.state.sync.halt) {
              break;
            }
          }
        }
      }
    },
    async syncFunctionSelectors(context, parameter) {
      logInfo("dataModule", "actions.syncFunctionSelectors: " + JSON.stringify(parameter));
      for (const [accountIndex, account] of parameter.accountsToSync.entries()) {
        console.log("actions.syncFunctionSelectors: " + accountIndex + " " + account);
        const accountData = context.state.accounts[parameter.chainId][account] || {};
        const txs = context.state.txs[parameter.chainId] || {};
        const txHashesByBlocks = getTxHashesByBlocks(account, parameter.chainId, context.state.accounts, context.state.accountsInfo, parameter.skipBlocks, parameter.maxBlocks);
        if (!context.state.sync.halt) {
          const missingFunctionSelectorsMap = {};
          const functionSelectors = context.state.functionSelectors || {};
          for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
            const block = context.state.blocks[parameter.chainId] && context.state.blocks[parameter.chainId][blockNumber] || null;
            for (const [index, txHash] of Object.keys(txHashes).entries()) {
              const txInfo = txs && txs[txHash] || {};
              if (txInfo.tx && txInfo.tx.to != null && txInfo.tx.data.length > 9) {
                const selector = txInfo.tx.data.substring(0, 10);
                if (!(selector in functionSelectors) && !(selector in missingFunctionSelectorsMap)) {
                  missingFunctionSelectorsMap[selector] = true;
                }
              }
            }
          }
          console.log("missingFunctionSelectorsMap: " + JSON.stringify(missingFunctionSelectorsMap));
          const missingFunctionSelectors = Object.keys(missingFunctionSelectorsMap);
          const BATCHSIZE = 50;
          for (let i = 0; i < missingFunctionSelectors.length; i += BATCHSIZE) {
            const batch = missingFunctionSelectors.slice(i, parseInt(i) + BATCHSIZE);
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
      }
    },
    async syncEventSelectors(context, parameter) {
      logInfo("dataModule", "actions.syncEventSelectors: " + JSON.stringify(parameter));
      for (const [accountIndex, account] of parameter.accountsToSync.entries()) {
        console.log("actions.syncEventSelectors: " + accountIndex + " " + account);
        const accountData = context.state.accounts[parameter.chainId][account] || {};
        const txs = context.state.txs[parameter.chainId] || {};
        const txHashesByBlocks = getTxHashesByBlocks(account, parameter.chainId, context.state.accounts, context.state.accountsInfo, parameter.skipBlocks, parameter.maxBlocks);
        if (!context.state.sync.halt) {
          const missingEventSelectorsMap = {};
          const eventSelectors = context.state.eventSelectors || {};
          for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
            const block = context.state.blocks[parameter.chainId] && context.state.blocks[parameter.chainId][blockNumber] || null;
            for (const [index, txHash] of Object.keys(txHashes).entries()) {
              const txInfo = txs && txs[txHash] || {};
              if ('txReceipt' in txInfo) {
                for (const event of txInfo.txReceipt.logs) {
                  if (!(event.topics[0] in eventSelectors) && !(event.topics[0] in missingEventSelectorsMap)) {
                    missingEventSelectorsMap[event.topics[0]] = true;
                  }
                }
              }
            }
          }
          console.log("missingEventSelectorsMap: " + JSON.stringify(missingEventSelectorsMap));
          const missingEventSelectors = Object.keys(missingEventSelectorsMap);
          const BATCHSIZE = 50;
          for (let i = 0; i < missingEventSelectors.length; i += BATCHSIZE) {
            const batch = missingEventSelectors.slice(i, parseInt(i) + BATCHSIZE);
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
      }
    },
    async syncBuildTokenContractsAndAccounts(context, parameter) {
      logInfo("dataModule", "actions.syncBuildTokenContractsAndAccounts: " + JSON.stringify(parameter));
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const ensReverseRecordsContract = new ethers.Contract(ENSREVERSERECORDSADDRESS, ENSREVERSERECORDSABI, provider);
      const preERC721s = store.getters['config/settings'].preERC721s;
      const accounts = context.state.accounts[parameter.chainId] || {};
      const txs = context.state.txs[parameter.chainId] || {};
      for (const [accountIndex, account] of parameter.accountsToSync.entries()) {
        console.log("actions.syncBuildTokenContractsAndAccounts: " + accountIndex + " " + account);
        const accountData = context.state.accounts[parameter.chainId][account] || {};
        const txHashesByBlocks = getTxHashesByBlocks(account, parameter.chainId, context.state.accounts, context.state.accountsInfo, parameter.skipBlocks, parameter.maxBlocks);
        if (!context.state.sync.halt) {
          const missingAccountsMap = {};
          const eventSelectors = context.state.eventSelectors || {};
          for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
            for (const [index, txHash] of Object.keys(txHashes).entries()) {
              const txData = txs && txs[txHash] || null;
              if (txData != null) {
                if (!(txData.tx.from in accounts) && !(txData.tx.from in missingAccountsMap)) {
                  missingAccountsMap[txData.tx.from] = true;
                }
                if (txData.tx.to != null && (!(txData.tx.to in accounts) && !(txData.tx.to in missingAccountsMap))) {
                  missingAccountsMap[txData.tx.to] = true;
                }
                const events = getEvents(account, accounts, preERC721s, txData);
                // console.log(blockNumber + " " + txHash + ": " + JSON.stringify(events.myEvents));
                // const results = parseTx(chainId, account, accounts, functionSelectors, preERC721s, tx);
                for (const [eventIndex, eventItem] of events.myEvents.entries()) {
                  for (let a of [eventItem.contract, eventItem.from, eventItem.to]) {
                    if (!(a in accounts) && !(a in missingAccountsMap)) {
                      missingAccountsMap[a] = true;
                    }
                  }
                }
              }
            }
          }
          const missingAccounts = Object.keys(missingAccountsMap);
          context.commit('setSyncSection', { section: 'Token Contract & Accts', total: missingAccounts.length });
          for (const [accountItemIndex, accountItem] of missingAccounts.entries()) {
            context.commit('setSyncCompleted', parseInt(accountItemIndex) + 1);
            console.log((parseInt(accountItemIndex) + 1) + "/" + missingAccounts.length + " Processing " + accountItem);
            const accountInfo = await getAccountInfo(accountItem, provider);
            if (accountInfo.account) {
              context.commit('addNewAccountInfo', accountInfo);
              context.commit('addNewAccount', accountInfo);
            }
            const names = await ensReverseRecordsContract.getNames([accountItem]);
            const name = names.length == 1 ? names[0] : accountItem;
            if (!(accountItem in context.state.ensMap)) {
              context.commit('addENSName', { account: accountItem, name });
            }
            if ((accountItemIndex + 1) % 25 == 0) {
              console.log("Saving accounts");
              context.dispatch('saveData', ['accountsInfo', 'accounts', 'ensMap']);
            }
            if (context.state.sync.halt) {
              break;
            }
          }
        }
      }
    },
    async syncBuildTokens(context, parameter) {
      logInfo("dataModule", "actions.syncBuildTokens: " + JSON.stringify(parameter));
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const ensReverseRecordsContract = new ethers.Contract(ENSREVERSERECORDSADDRESS, ENSREVERSERECORDSABI, provider);
      const preERC721s = store.getters['config/settings'].preERC721s;
      const accounts = context.state.accounts[parameter.chainId] || {};
      const txs = context.state.txs[parameter.chainId] || {};
      for (const [accountIndex, account] of parameter.accountsToSync.entries()) {
        console.log("actions.syncBuildTokens: " + accountIndex + " " + account);
        const accountData = context.state.accounts[parameter.chainId][account] || {};
        const txHashesByBlocks = getTxHashesByBlocks(account, parameter.chainId, context.state.accounts, context.state.accountsInfo, parameter.skipBlocks, parameter.maxBlocks);
        if (!context.state.sync.halt) {
          const missingTokensMap = {};
          for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
            for (const [index, txHash] of Object.keys(txHashes).entries()) {
              const txData = txs && txs[txHash] || null;
              if (txData != null) {
                const events = getEvents(account, accounts, preERC721s, txData);
                const results = parseTx(parameter.chainId, account, accounts, context.state.functionSelectors, preERC721s, txData);
                for (const [eventIndex, eventItem] of events.myEvents.entries()) {
                  if (eventItem.type == 'preerc721' || eventItem.type == 'erc721' || eventItem.type == 'erc1155') {
                    const tokenContract = accounts[eventItem.contract] || {};
                    console.log(blockNumber + " " + txHash + " " + eventItem.type + " " + eventItem.contract + " " + (tokenContract ? tokenContract.type : '') + " " + (tokenContract ? tokenContract.name : '') + " " + (eventItem.tokenId ? eventItem.tokenId : '?'));
                    if (!(eventItem.tokenId in tokenContract.assets)) {
                      if (!(eventItem.contract in missingTokensMap)) {
                        missingTokensMap[eventItem.contract] = {};
                      }
                      if (!(eventItem.tokenId in missingTokensMap[eventItem.contract])) {
                        missingTokensMap[eventItem.contract][eventItem.tokenId] = true;
                      }
                    }
                  }
                }
              }
            }
          }
          let totalItems = 0;
          const missingTokensList = [];
          for (const [tokenContract, tokenIds] of Object.entries(missingTokensMap)) {
            totalItems += Object.keys(tokenIds).length;
            for (let tokenId of Object.keys(tokenIds)) {
              missingTokensList.push({ tokenContract, tokenId });
            }
          }
          context.commit('setSyncSection', { section: 'Build Tokens', total: missingTokensList.length });
          const GETTOKENINFOBATCHSIZE = 50;
          const info = {};
          const DELAYINMILLIS = 2000;
          for (let i = 0; i < missingTokensList.length && !context.state.sync.halt; i += GETTOKENINFOBATCHSIZE) {
            const batch = missingTokensList.slice(i, parseInt(i) + GETTOKENINFOBATCHSIZE);
            let continuation = null;
            do {
              let url = "https://api.reservoir.tools/tokens/v5?" + batch.map(e => 'tokens=' + e.tokenContract + ':' + e.tokenId).join("&");
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
        }
      }
    },
    async syncBuildTokenEvents(context, parameter) {
      logInfo("dataModule", "actions.syncBuildTokenEvents: " + JSON.stringify(parameter));
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const ensReverseRecordsContract = new ethers.Contract(ENSREVERSERECORDSADDRESS, ENSREVERSERECORDSABI, provider);
      const preERC721s = store.getters['config/settings'].preERC721s;
      const accounts = context.state.accounts[parameter.chainId] || {};
      const txs = context.state.txs[parameter.chainId] || {};
      for (const [accountIndex, account] of parameter.accountsToSync.entries()) {
        console.log("actions.syncBuildTokens: " + accountIndex + " " + account);
        const accountData = context.state.accounts[parameter.chainId][account] || {};
        const txHashesByBlocks = getTxHashesByBlocks(account, parameter.chainId, context.state.accounts, context.state.accountsInfo, parameter.skipBlocks, parameter.maxBlocks);
        if (!context.state.sync.halt) {
          const missingTokensMap = {};
          for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
            for (const [index, txHash] of Object.keys(txHashes).entries()) {
              const txData = txs && txs[txHash] || null;
              if (txData != null) {
                const events = getEvents(account, accounts, preERC721s, txData);
                const results = parseTx(parameter.chainId, account, accounts, context.state.functionSelectors, preERC721s, txData);
                for (const [eventIndex, eventItem] of events.myEvents.entries()) {
                  if (eventItem.type == 'preerc721' || eventItem.type == 'erc721' || eventItem.type == 'erc1155') {
                    const tokenContract = accounts[eventItem.contract] || {};
                    console.log(blockNumber + " " + txHash + " " + eventItem.type + " " + eventItem.contract + " " + (tokenContract ? tokenContract.type : '') + " " + (tokenContract ? tokenContract.name : '') + " " + (eventItem.tokenId ? eventItem.tokenId : '?'));
                    if (!(eventItem.tokenId in tokenContract.assets)) {
                      if (!(eventItem.contract in missingTokensMap)) {
                        missingTokensMap[eventItem.contract] = {};
                      }
                      if (!(eventItem.tokenId in missingTokensMap[eventItem.contract])) {
                        missingTokensMap[eventItem.contract][eventItem.tokenId] = true;
                      }
                    }
                  }
                }
              }
            }
          }
          let totalItems = 0;
          const missingTokensList = [];
          for (const [tokenContract, tokenIds] of Object.entries(missingTokensMap)) {
            totalItems += Object.keys(tokenIds).length;
            for (let tokenId of Object.keys(tokenIds)) {
              missingTokensList.push({ tokenContract, tokenId });
            }
          }
          context.commit('setSyncSection', { section: 'Build Tokens', total: missingTokensList.length });
          const GETTOKENINFOBATCHSIZE = 50;
          const info = {};
          const DELAYINMILLIS = 2000;
          for (let i = 0; i < missingTokensList.length && !context.state.sync.halt; i += GETTOKENINFOBATCHSIZE) {
            const batch = missingTokensList.slice(i, parseInt(i) + GETTOKENINFOBATCHSIZE);
            let continuation = null;
            do {
              let url = "https://api.reservoir.tools/tokens/v5?" + batch.map(e => 'tokens=' + e.tokenContract + ':' + e.tokenId).join("&");
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
        }
      }

      //   for (let event of events) {
      //     const contractData = context.state.accounts[chainId][event.contract] || null;
      //     if (contractData) {
      //       if (contractData.type != event.type) {
      //         // TODO
      //         console.log("TODO contractData: " + JSON.stringify(contractData));
      //         console.log("         vs event: " + JSON.stringify(event));
      //       } else {
      //         const assets = contractData.assets;
      //         if (event.type == 'erc721' || event.type == 'erc1155') {
      //           if (event.tokenId in assets) {
      //             const token = assets[event.tokenId];
      //             const tokenEvents = token.events;
      //             if (!token.events[event.txHash] || !token.events[event.txHash][event.logIndex]) {
      //               context.commit('addAccountTokenEvent', event);
      //             }
      //           }
      //         }
      //       }
      //     }
      //     if (context.state.sync.halt) {
      //       break;
      //     }
      //   }
      //
    },
    async syncImportExchangeRates(context, parameter) {
      const reportingCurrency = store.getters['config/settings'].reportingCurrency;
      logInfo("dataModule", "actions.syncImportExchangeRates - reportingCurrency: " + reportingCurrency);
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
    },

    // Called by Connection.execWeb3()
    async execWeb3({ state, commit, rootState }, { count, listenersInstalled }) {
      logInfo("dataModule", "execWeb3() start[" + count + ", " + listenersInstalled + ", " + JSON.stringify(rootState.route.params) + "]");
    },
  },
};
