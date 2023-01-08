const Welcome = {
  template: `
    <div class="m-0 p-0">

      <b-card no-body no-header class="border-0" header-class="p-1">
        <b-card no-body class="border-0 m-0 mt-2">

          <b-card-body class="p-0">
            <b-card class="mb-2 border-0">

              <b-card-text>
                <h5>Welcome to txs</h5>
                A dapp to help manage your Ethereum portfolio. Status: <b>WIP</b>
              </b-card-text>

              <b-card-text class="mt-3 mb-2">
                <h6>Usage</h6>
                <ul>
                  <li>
                    Click <b-button size="sm" variant="link" class="m-0 p-0"><b-icon-pencil shift-v="+1" font-scale="1.0"></b-icon-pencil></b-button> in the Accounts tab to enter your account(s)
                  </li>
                  <li>
                    Click <b-button size="sm" variant="link" class="m-0 p-0"><b-icon-cloud-download shift-v="+1" font-scale="1.2"></b-icon-cloud-download></b-button> to incrementally:
                    <ul>
                      <li>
                        Retrieve all ERC-20, ERC-721 and ERC-1155 events related to your accounts via your web3 connection
                      </li>
                      <li>
                        Retrieve all transactions and internal transactions related to your accounts via the Etherscan API
                      </li>
                      <li>
                        Retrieve all transaction and transaction receipt information via your web3 connection, for the transaction hashes of the data imported above
                      </li>
                      <li>
                        Retrieve collection and token metadata via the Reservoir API, for the contracts and assets resulting from the above processing
                      </li>
                      <li>
                        Compute a simpler representation of your transactions
                      </li>
                    </ul>
                  </li>
                  <!--
                  <li>
                    View your transactions by accounts in the Account tab
                  </li>
                  -->
                  <li>
                    Click on the Generate Report icon <b-button size="sm" variant="link" class="m-0 p-0"><b-icon-newspaper shift-v="+1" font-scale="1.0"></b-icon-newspaper></b-button> in the Report tab for the results to be displayed
                  </li>
                  <li>
                    Enter your Etherscan API key in the Config tab to avoid your API data retrieval being throttled to 1 request per 6 seconds
                  </li>
                  <li>
                    <b>WIP</b> You may have to re-enter your accounts and resync as this dapp still requires some data structure changes
                  </li>
                </ul>
              </b-card-text>

              <b-card-text class="mt-3 mb-2">
                <h6>Your Data</h6>
                <ul>
                  <li>
                    Your personal information (e.g., accounts, Etherscan API key) is stored in your web browser local storage (LocalStorage and IndexedDB)
                  </li>
                  <li>
                    Your accounts will be used when querying data via the web3 connection
                  </li>
                  <li>
                    Your Etherscan API key and your accounts will be used when querying data via the Etherscan API
                  </li>
                  <li>
                    Your collections and tokens will be used when querying data via the Reservoir API
                  </li>
                </ul>
              </b-card-text>

              <b-card-text class="mt-3 mb-2">
                <h6>Source Code</h6>
                <ul>
                  <li>
                    <b-link href="https://github.com/bokkypoobah/txs" target="_blank">https://github.com/bokkypoobah/txs</b-link>
                  </li>
                </ul>
              </b-card-text>

              <b-card-text v-if="false" class="mt-3 mb-2">
                <h5>ERC-721 Token Collection Data Retrieval</h5>
                <ul>
                  <li>
                    The ERC721Helper contract at <b-link :href="network.explorer + 'address/' + network.erc721HelperAddress + '#code'" target="_blank">{{ network.erc721HelperAddress && network.erc721HelperAddress.substring(0, 20) + '...' || '' }}</b-link> allows this Web3 UI to retrieve the token ownership and tokenURI information for ERC-721 NFT collections in bulk, via the web3 connection.
                  </li>
                  <li>
                    The tokenURI information for each tokenId within an NFT collection may have an image and/or traits. This can be parsed and used for displaying and filtering.
                  </li>
                </ul>
              </b-card-text>

              <b-card-text v-if="false" class="mt-3 mb-2">
                <h5>Royalties</h5>
                <ul>
                  <li>
                    This exchange uses <b-link href="https://royaltyregistry.xyz/lookup" target="_blank">Manifold's Royalty Engine</b-link> at <b-link :href="explorer + 'address/' + network.nixRoyaltyEngine + '#code'" target="_blank">{{ network.nixRoyaltyEngine && nixRoyaltyEngine.substring(0, 20) + '...' || '' }}</b-link> to compute the royalty payments on NFT sales. Note that there can be different royalty payment rates for different tokenIds within the same collection.
                  </li>
                  <li>
                    Deployers of ERC-721 token collection configure the royalty payment information in the <b-link href="https://royaltyregistry.xyz/configure" target="_blank">Royalty Registry</b-link>.
                  </li>
                  <li>
                    Makers specify a <b>royaltyFactor</b> (in percent, 0 to 1000, or 0x to 10x) when adding orders. Takers specify a royaltyFactor when executing against the orders. The NFT seller's royaltyFactor is multiplied by the royalty payments computed by the Royalty Engine. i.e., sellers pay 0x to 10x the royalty payment recommended by the Royalty Engine configuration.
                  </li>
                </ul>
              </b-card-text>

              <b-card-text v-if="false" class="mt-3 mb-2">
                <h5>Calculating NetAmount</h5>
                <ul>
                  <li>
                    As a taker, if you are selling an NFT, you will receive WETH minus any royalty payments. So selling an NFT for 0.1 WETH with a 1% royalty payment and 100% royaltyFactor will result in a netAmount of 0.0099 WETH. 0.0001 WETH will be paid to the collection owner address.
                  </li>
                </ul>
              </b-card-text>

              <b-card-text v-if="false" class="mt-3 mb-2">
                <h5>Repos</h5>
                <ul>
                  <li>
                    <b-link href="https://github.com/bokkypoobah/Nix" target="_blank">https://github.com/bokkypoobah/Nix</b-link> - smart contracts.
                  </li>
                  <li>
                    <b-link href="https://github.com/bokkypoobah/NixApp" target="_blank">https://github.com/bokkypoobah/NixApp</b-link> - this web3 dapp.
                  </li>
                </ul>
              </b-card-text>

            </b-card>
          </b-card-body>
        </b-card>
      </b-card>
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
    chainId() {
      return store.getters['connection/chainId'];
    },
  },
  methods: {
    async timeoutCallback() {
      logDebug("Welcome", "timeoutCallback() count: " + this.count);

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
    logDebug("Welcome", "beforeDestroy()");
  },
  mounted() {
    logDebug("Welcome", "mounted() $route: " + JSON.stringify(this.$route.params));
    this.reschedule = true;
    logDebug("Welcome", "Calling timeoutCallback()");
    this.timeoutCallback();
    // this.loadNFTs();
  },
  destroyed() {
    this.reschedule = false;
  },
};

const welcomeModule = {
  namespaced: true,
  state: {
    params: null,
    executing: false,
    executionQueue: [],
  },
  getters: {
    params: state => state.params,
    executionQueue: state => state.executionQueue,
  },
  mutations: {
    deQueue(state) {
      logDebug("welcomeModule", "deQueue(" + JSON.stringify(state.executionQueue) + ")");
      state.executionQueue.shift();
    },
    updateParams(state, params) {
      state.params = params;
      logDebug("welcomeModule", "updateParams('" + params + "')")
    },
    updateExecuting(state, executing) {
      state.executing = executing;
      logDebug("welcomeModule", "updateExecuting(" + executing + ")")
    },
  },
  actions: {
  },
};
