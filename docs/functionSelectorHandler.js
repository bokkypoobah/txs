const _FUNCTIONSELECTORHANDLER = [
  {
    name: "ERC20",
    functionSelectors: {
      "0xa9059cbb": "transfer(address _to, uint256 _value)",
      "0x095ea7b3": "approve(address guy, uint256 wad)",
    },
    process: function(txData, account, accounts, events, results) {
      if (results.functionSelector == "0xa9059cbb") {
        for (const event of txData.txReceipt.logs) {
          if (event.address == txData.tx.to && event.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
            const from = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
            const to = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
            const tokens = event.topics.length == 3 ? ethers.BigNumber.from(event.data) : ethers.BigNumber.from(event.topics[3]);
            if (to == account) {
              results.info = { type: "erc20", action: "received", contract: event.address, from, tokens: tokens.toString() };
            } else if (from == account) {
              results.info = { type: "erc20", action: "sent", contract: event.address, to, tokens: tokens.toString() };
            }
          }
        }

      } else if (results.functionSelector == "0x095ea7b3") {
        for (const event of txData.txReceipt.logs) {
          if (event.address == txData.tx.to && event.topics[0] == "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925") {
            const tokenOwner = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
            const operator = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
            let tokens = event.topics.length == 3 ? ethers.BigNumber.from(event.data).toString() : ethers.BigNumber.from(event.topics[3]).toString();
            results.info = { type: "erc20", action: "approved", contract: event.address, tokenOwner, operator, tokens };
          }
        }
        if (!results.info) {
          // TODO Get from function call params
          results.info = { type: "erc20", action: "approved", contract: txData.tx.to, tokenOwner: null, operator: null, tokens: null };
        }
      }
    },
  },
  {
    name: "ERC721AND1155",
    functionSelectors: {
      "0xa22cb465": "setApprovalForAll(address operator,bool approved)", // ERC-721 ? ERC-1155
      "0x42842e0e": "safeTransferFrom(address,address,uint256)", // ERC-721
      "0x23b872dd": "transferFrom(address,address,uint256)", // ERC-721
      "0xf242432a": "safeTransferFrom(address,address,uint256,uint256,bytes)", // ERC-1155
      "0x2eb2c2d6": "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)", // ERC-1155
      "0x3f801f91": true, // Old Opensea Bulk Transfers @ 0xA64528Ce3c465C47258F14106FE903C201b07374
      "0x32389b71": true, // Opensea Bulk Transfers @ 0x0000000000c2d145a2526bD8C716263bFeBe1A72
      "0xd9eccc2e": true, // sendToMany(address from, address[] to, uint256 id, uint256 amount, bytes data) @ 0xD9c8e3d79B44679A4837E2D53c5da43Ca582DADf
      "0x54ffbd23": true, // Bulksender.app @ 0xd1917932A7Db6Af687B523D5Db5d7f5c2734763F
      "0xe96c3edb": true, // Bulksender.app @ 0xd1917932A7Db6Af687B523D5Db5d7f5c2734763F
    },
    process: function(txData, account, accounts, events, results) {
      if (results.functionSelector == "0xa22cb465") {
        for (const event of txData.txReceipt.logs) {
          // ApprovalForAll (index_topic_1 address owner, index_topic_2 address operator, bool approved)
          if (event.address == txData.tx.to && event.topics[0] == "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31") {
            const owner = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
            const operator = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
            const approved = ethers.BigNumber.from(event.data) > 0;
            const info = getTokenContractInfo(event.address, accounts);
            results.info = { type: "nft", action: "approvedforall", contract: event.address, owner, operator, approved };
          }
        }
      } else {
        if (events.receivedNFTEvents.length > 0) {
          results.info = { type: "nft", action: "received", from: txData.tx.from, events: events.receivedNFTEvents };
        }
        if (events.sentNFTEvents.length > 0) {
          results.info = { type: "nft", action: "sent", /* to: txData.tx.to,*/ events: events.sentNFTEvents };
        }
      }
    },
  },
  {
    name: "General",
    functionSelectors: {
      "0xf14fcbc8": "function commit(bytes32 commitment)", // ENS commit
      "0xd5fa2b00": "function setAddr(bytes32 node, address a)", // Reverse ENS set
      "0x304e6ade": "function setContenthash(bytes32 node, bytes hash)", // Set ENS field
      "0x1896f70a": "function setResolver(bytes32 node, address resolver)", // Set ENS resolver
      "0xf2fde38b": "function transferOwnership(address newOwner)",
    },
    process: function(txData, account, accounts, events, results) {
      const interface = new ethers.utils.Interface([
        "function commit(bytes32 commitment)",
        "function setAddr(bytes32 node, address a)",
        "function setContenthash(bytes32 node, bytes hash)",
        "function setResolver(bytes32 node, address resolver)",
        "function transferOwnership(address newOwner)",
      ]);
      let decodedData = interface.parseTransaction({ data: txData.tx.data, value: txData.tx.value });
      if (decodedData.functionFragment.name == "commit") {
        const commitment = decodedData.args[0];
        results.info = {
          type: "ens",
          action: "committed",
          commitment,
        };
      } else if (decodedData.functionFragment.name == "setAddr") {
        const node = decodedData.args[0];
        const tokenId = ethers.BigNumber.from(node).toString();
        const a = decodedData.args[1];
        results.info = {
          type: "ens",
          action: "reverseensset",
          tokenId,
          node,
          a,
        };
      } else if (decodedData.functionFragment.name == "setContenthash") {
        const node = decodedData.args[0];
        const tokenId = ethers.BigNumber.from(node).toString();
        const hash = decodedData.args[1];
        results.info = {
          type: "ens",
          action: "contenthashset",
          tokenId,
          node,
          hash,
        };
      } else if (decodedData.functionFragment.name == "setResolver") {
        const node = decodedData.args[0];
        const tokenId = ethers.BigNumber.from(node).toString();
        const resolver = decodedData.args[1];
        results.info = {
          type: "ens",
          action: "resolverset",
          tokenId,
          node,
          resolver,
        };
      } else if (decodedData.functionFragment.name == "transferOwnership") {
        const newOwner = decodedData.args[0];
        results.info = {
          type: "contract",
          action: "ownershiptransferred",
          newOwner,
        };
      }
    },
  },
  {
    name: "TokenTrader*",
    functionSelectors: {
      "0x3d6a32bd": "createTradeContract(address asset, uint256 buyPrice, uint256 sellPrice, uint256 units, bool buysTokens, bool sellsTokens)", // 0xA9F801f160fe6A866dD3404599350AbBCAA95274
    },
    process: function(txData, account, accounts, events, results) {
      console.log("createTradeContract");
    },
  },
];
