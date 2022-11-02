const Config = {
  template: `
    <div class="mt-5 pt-3">
      <b-card class="mt-5" header-class="warningheader" header="Web3 Connection And/Or Incorrect Network Detected" v-if="!powerOn || (network.chainId != 1 && network.chainId != 4)">
        <b-card-text>
          Please install the MetaMask extension, connect to the Rinkeby network and refresh this page. Then click the [Power] button on the top right.
        </b-card-text>
      </b-card>

      <b-card no-body header="Config" class="border-0" header-class="p-1" v-if="network.chainId == 1 || network.chainId == 4">
        <b-card no-body class="border-0 m-0 mt-2">
          <b-card-body class="p-0">

            <div>
              <b-card no-body class="mt-2">
              Blah
              </b-card>
            </div>

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
    etherscanAPIKey() {
      return store.getters['config/etherscanAPIKey'];
    },
    periodStart() {
      return store.getters['config/periodStart'];
    },
  },
  methods: {

    //
    // async checkTestToadzRoyalty() {
    //   event.preventDefault();
    //   const provider = new ethers.providers.Web3Provider(window.ethereum);
    //   const nix = new ethers.Contract(store.getters['connection/network'].nixAddress, NIXABI, provider);
    //   const nixRoyaltyEngine = await nix.royaltyEngine();
    //   this.testToadz.nixRoyaltyEngine = nixRoyaltyEngine;
    //   const royaltyEngine = new ethers.Contract(nixRoyaltyEngine, ROYALTYENGINEABI, provider);
    //   const royaltyPayments = [];
    //   try {
    //     const results = await royaltyEngine.getRoyaltyView(TESTTOADZADDRESS, this.testToadz.royaltyTokenId, ethers.utils.parseEther(this.testToadz.royaltyAmount));
    //     for (let i = 0; i < results[0].length; i++) {
    //       royaltyPayments.push({ payTo: results[0][i], payAmount: results[1][i] });
    //     }
    //   } catch (e) {
    //     royaltyPayments.push({ payTo: "Error", payAmount: "Error" });
    //   }
    //   this.testToadz.royaltyPayments = royaltyPayments;
    // },

    // approveTestToadzToNix(approved) {
    //   console.log("approveTestToadzToNix(" + approved + ")");
    //   this.$bvModal.msgBoxConfirm(approved ? 'Approve TestToadz for Nix trading?' : 'Revoke TestToadz approval for Nix trading?', {
    //       title: 'Please Confirm',
    //       size: 'sm',
    //       buttonSize: 'sm',
    //       okVariant: 'danger',
    //       okTitle: 'Yes',
    //       cancelTitle: 'No',
    //       footerClass: 'p-2',
    //       hideHeaderClose: false,
    //       centered: true
    //     })
    //     .then(async value1 => {
    //       if (value1) {
    //         event.preventDefault();
    //         const provider = new ethers.providers.Web3Provider(window.ethereum);
    //         const testToadz = new ethers.Contract(TESTTOADZADDRESS, TESTTOADZABI, provider);
    //         const testToadzSigner = testToadz.connect(provider.getSigner());
    //         try {
    //           const tx = await testToadzSigner.setApprovalForAll(store.getters['connection/network'].nixAddress, approved);
    //           this.testToadz.approvalMessage = tx.hash;
    //           console.log("tx: " + JSON.stringify(tx));
    //         } catch (e) {
    //           this.testToadz.approvalMessage = e.message.toString();
    //           console.log("error: " + e.toString());
    //         }
    //       }
    //     })
    //     .catch(err => {
    //       // An error occurred
    //     });
    // },

    // mintTestToadz() {
    //   console.log("mintTestToadz()");
    //   this.$bvModal.msgBoxConfirm('Mint ' + this.testToadz.mintNumber + ' TestToadz?', {
    //       title: 'Please Confirm',
    //       size: 'sm',
    //       buttonSize: 'sm',
    //       okVariant: 'danger',
    //       okTitle: 'Yes',
    //       cancelTitle: 'No',
    //       footerClass: 'p-2',
    //       hideHeaderClose: false,
    //       centered: true
    //     })
    //     .then(async value1 => {
    //       if (value1) {
    //         event.preventDefault();
    //         const provider = new ethers.providers.Web3Provider(window.ethereum);
    //         const testToadz = new ethers.Contract(TESTTOADZADDRESS, TESTTOADZABI, provider);
    //         const testToadzSigner = testToadz.connect(provider.getSigner());
    //         try {
    //           const tx = await testToadzSigner.mint(this.testToadz.mintNumber);
    //           this.testToadz.mintMessage = tx.hash;
    //           console.log("tx: " + JSON.stringify(tx));
    //         } catch (e) {
    //           this.testToadz.mintMessage = e.message.toString();
    //           console.log("error: " + e.toString());
    //         }
    //       }
    //     })
    //     .catch(err => {
    //       // An error occurred
    //     });
    // },

    async timeoutCallback() {
      logDebug("Config", "timeoutCallback() count: " + this.count);

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
    logDebug("Config", "beforeDestroy()");
  },
  mounted() {
    logDebug("Config", "mounted() $route: " + JSON.stringify(this.$route.params));
    // store.dispatch('config/setEtherscanAPIKey', "Blah");
    // store.dispatch('config/setPeriodStart', "Bluh");
    store.dispatch('config/restoreState');
    this.reschedule = true;
    logDebug("Config", "Calling timeoutCallback()");
    this.timeoutCallback();
    // this.loadNFTs();
  },
  destroyed() {
    this.reschedule = false;
  },
};

const configModule = {
  namespaced: true,
  state: {
    etherscanAPIKey: null,
    periodStart: null,
  },
  getters: {
    etherscanAPIKey: state => state.etherscanAPIKey,
    periodStart: state => state.periodStart,
  },
  mutations: {
    setEtherscanAPIKey(state, p) {
      // logInfo("configModule", "mutations.setEtherscanAPIKey('" + p + "')")
      state.etherscanAPIKey = p;
    },
    setPeriodStart(state, p) {
      // logInfo("configModule", "mutations.setPeriodStart('" + p + "')")
      state.periodStart = p;
    },
  },
  actions: {
    restoreState(context) {
      // logInfo("configModule", "actions.restoreState()");
      if ('txsEtherscanAPIKey' in localStorage) {
        context.commit('setEtherscanAPIKey', localStorage.txsEtherscanAPIKey);
      }
      if ('txsPeriodStart' in localStorage) {
        context.commit('setPeriodStart', localStorage.txsPeriodStart);
      }
      logInfo("configModule", "actions.restoreState() - state: " + JSON.stringify(context.state));
    },
    setEtherscanAPIKey(context, p) {
      // logInfo("configModule", "actions.setEtherscanAPIKey(" + JSON.stringify(p) + ")");
      context.commit('setEtherscanAPIKey', p);
      localStorage.txsEtherscanAPIKey = p;
    },
    setPeriodStart(context, p) {
      // logInfo("configModule", "actions.setPeriodStart(" + JSON.stringify(p) + ")");
      context.commit('setPeriodStart', p);
      localStorage.txsPeriodStart = p;
    },
  },
};
