function getEvents(txData) {
  const erc20Events = [];
  const erc721Events = [];
  const erc1155Events = [];
  const erc20FromMap = {};
  const erc20ToMap = {};
  for (const event of txData.txReceipt.logs) {
    // console.log(JSON.stringify(event));
    // Transfer (index_topic_1 address from, index_topic_2 address to, uint256 value)
    if (event.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
      const from = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
      const to = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
      // ERC-721 Transfer
      if (event.topics.length == 4) {
        const tokenId = ethers.BigNumber.from(event.topics[3]).toString();
        erc721Events.push({ contract: event.address, from, to, tokenId });
        // ERC-20 Transfer
      } else {
        const tokens = ethers.BigNumber.from(event.data).toString();
        erc20Events.push({ contract: event.address, from, to, tokens });
        if (!(from in erc20FromMap)) {
          erc20FromMap[from] = 1;
        } else {
          erc20FromMap[from] = parseInt(erc20FromMap[from]) + 1;
        }
        if (!(to in erc20ToMap)) {
          erc20ToMap[to] = 1;
        } else {
          erc20ToMap[to] = parseInt(erc20ToMap[to]) + 1;
        }
      }
      // let tokens = event.topics.length == 3 ? ethers.BigNumber.from(event.data).toString() : ethers.BigNumber.from(event.topics[3]).toString();
      // console.log("ERC-20 " + event.address + ", from: " + from + ", to: " + to + ", tokens: " + tokens);
      // if (txData.tx.hash == "0xf9dcdb65a12ed5ff4a95af1ac5ce3ed02ce535ad8bcbccc23c667a9a9e24e49d") {
      //   console.log("ERC-20 " + event.address + ", from: " + from + ", to: " + to + ", tokens: " + tokens);
      // }
      // ERC-1155 TransferSingle (index_topic_1 address _operator, index_topic_2 address _from, index_topic_3 address _to, uint256 _id, uint256 _value)
    } else if (event.topics[0] == "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62") {
      const operator = ethers.utils.getAddress("0x" + event.topics[1].substring(26));
      const from = ethers.utils.getAddress("0x" + event.topics[2].substring(26));
      const to = ethers.utils.getAddress("0x" + event.topics[3].substring(26));
      const tokenId = ethers.BigNumber.from(event.data.substring(0, 66)).toString();
      const tokens = ethers.BigNumber.from("0x" + event.data.substring(67, 130)).toString();
      erc1155Events.push({ contract: event.address, operator, from, to, tokenId, tokens });
      // eventRecord = { txHash, blockNumber, logIndex, contract, from, to, tokenId, tokens, type: "erc1155" };
    }
  }
  return { erc20Events, erc721Events, erc1155Events, erc20FromMap, erc20ToMap };
}

function accumulateTxResults(accumulatedData, results) {
  if (!('ethBalance' in accumulatedData)) {
    accumulatedData.ethBalance = ethers.BigNumber.from(0);
  }
  accumulatedData.ethBalancePrev = accumulatedData.ethBalance;
  accumulatedData.ethBalance = accumulatedData.ethBalance.add(results.ethReceived).sub(results.ethPaid).sub(results.txFee);
  console.log("  * " + ethers.utils.formatEther(accumulatedData.ethBalance) +
    "Ξ = " + ethers.utils.formatEther(accumulatedData.ethBalancePrev) +
    "Ξ + " + ethers.utils.formatEther(results.ethReceived) +
    "Ξ - " + ethers.utils.formatEther(results.ethPaid) +
    "Ξ - " + ethers.utils.formatEther(results.txFee) +
    "Ξ : " + (results.info || "(TODO)"));
}

function parseTx(chainId, account, accounts, txData) {
  // console.log("parseTx: " + JSON.stringify(account));
  const results = {};
  const gasUsed = ethers.BigNumber.from(txData.txReceipt.gasUsed);
  const txFee = gasUsed.mul(txData.txReceipt.effectiveGasPrice);
  results.gasUsed = gasUsed;
  results.txFee = txData.tx.from == account ? txFee : 0;
  results.ethReceived = 0;
  results.ethPaid = 0;

  // TODO: Identify internal transfers
  // EOA to EOA ETH transfer
  if (gasUsed == 21000) {
    if (txData.tx.from == account && txData.tx.to == account) {
      results.info = "Cancel tx";
    } else if (txData.tx.from == account) {
      results.ethPaid = ethers.BigNumber.from(txData.tx.value).toString();
      results.info = "Sent " + ethers.utils.formatEther(txData.tx.value) + "Ξ to " + txData.tx.to;
    } else if (txData.tx.to == account) {
      results.ethReceived = ethers.BigNumber.from(txData.tx.value).toString();
      results.info = "Received " + ethers.utils.formatEther(txData.tx.value) + "Ξ from " + txData.tx.from;
    }
  }

  // events.push({ from: txData.tx.from, to: null, operator: null, type: "txfee", asset: "eth", tokenId: null, value: txFee });
  let events = null;
  if (!results.info) {
    events = getEvents(txData);
    if ((Object.keys(events.erc20FromMap).length < 3) && (Object.keys(events.erc20ToMap).length > 3) && (account in events.erc20ToMap)) {
      // console.log("  Received Airdrop: " + JSON.stringify(erc20Events));
      results.info = "Received Airdrop";
    }
    // TODO:
    // if (events.erc721Events.length > 0) {
    //   console.log("ERC-721: " + JSON.stringify(events.erc721Events));
    // }
    // if (erc1155Events.length > 0) {
    //   console.log("ERC-1155: " + JSON.stringify(erc1155Events));
    // }
  }

  // TokenTrader.TradeListing (index_topic_1 address ownerAddress, index_topic_2 address tokenTraderAddress, index_topic_3 address asset, uint256 buyPrice, uint256 sellPrice, uint256 units, bool buysTokens, bool sellsTokens)
  if (!results.info && txData.tx.data.substring(0, 10) == "0x3d6a32bd") {
    for (const event of txData.txReceipt.logs) {
      if (event.topics[0] == "0x65ff0f5aef2091ad3616436792adf51be3068c631b081ac0f30f77e3a0e6502d") {
        // let amount = ethers.BigNumber.from(event.data);
        results.info = "TokenTrader.TradeListing";
      }
    }
  }
  // TokenTrader.MakerWithdrewEther
  if (!results.info && txData.tx.data.substring(0, 10) == "0x2170ebf7") {
    for (const event of txData.txReceipt.logs) {
      if (event.topics[0] == "0x8a93d70d792b644d97d7da8a5798e03bbee85be4537a860a331dbe3ee50eb982") {
        let amount = ethers.BigNumber.from(event.data);
        results.info = "TokenTrader.MakerWithdrewEther";
      }
    }
  }
  // TokenTrader.MakerWithdrewAsset
  if (!results.info && txData.tx.data.substring(0, 10) == "0xcd53a3b7") {
    for (const event of txData.txReceipt.logs) {
      if (event.topics[0] == "0x1ebbc515a759c3fe8e048867aac7fe458e3a37ac3dd44ffc73a6238cf3003981") {
        let amount = ethers.BigNumber.from(event.data);
        results.info = "TokenTrader.MakerWithdrewAsset";
      }
    }
  }
  // TokenTrader.MakerTransferredAsset
  if (!results.info && txData.tx.data.substring(0, 10) == "0x52954e5a") {
    for (const event of txData.txReceipt.logs) {
      if (event.topics[0] == "0x127afec6b0ab48f803536010148b79615f4a518f9b574de5b45bc74991c46d51") {
        // let amount = ethers.BigNumber.from(event.data);
        results.info = "TokenTrader.MakerTransferredAsset";
      }
    }
  }

  // ERC-20 approve(address guy, uint256 wad)
  if (!results.info && txData.tx.data.substring(0, 10) == "0x095ea7b3") {
    for (const event of txData.txReceipt.logs) {
      if (event.address == txData.tx.to && event.topics[0] == "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925") {
        const tokenOwner = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
        const operator = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
        let tokens = event.topics.length == 3 ? ethers.BigNumber.from(event.data) : ethers.BigNumber.from(event.topics[3]);
        if (tokens > 1_000_000_100) {
          results.info = "ERC-20 large approval";
        } else {
          results.info = "ERC-20 approved for " + event.address.substring(0, 16);
        }
      }
    }
  }

  // ERC-20 transfer(address _to, uint256 _value)
  if (!results.info && txData.tx.data.substring(0, 10) == "0xa9059cbb") {
    // const interface = new ethers.utils.Interface(ERC20ABI);
    // let decodedData = interface.parseTransaction({ data: txData.tx.data, value: txData.tx.value });
    for (const event of txData.txReceipt.logs) {
      // console.log("ERC-20 transfer " + JSON.stringify(event));
      if (event.address == txData.tx.to && event.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
        const from = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
        const to = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
        let tokens = event.topics.length == 3 ? ethers.BigNumber.from(event.data) : ethers.BigNumber.from(event.topics[3]);
        // console.log("  ERC-20 transfer of " + event.address + " from " + from + " to " + to + " value " + tokens);

        if (from == account && to == account) {
          results.info = "ERC-20 - Self Transfer ERC-20:" + event.address + " " + tokens + " tokens";
        } else if (from == account) {
          results.info = "ERC-20 - Sent ERC-20:" + event.address + " " + tokens + " tokens to " + to;
        } else if (to == account) {
          results.info = "ERC-20 - Received ERC-20:" + event.address + " " + tokens + " tokens from " + from;
        }
      }
    }
  }

  // ERC-721 safeTransferFrom(address from, address to, uint256 tokenId)
  if (txData.tx.data.substring(0, 10) == "0x42842e0e") {
    const interface = new ethers.utils.Interface(ERC721ABI);
    // let decodedData = interface.parseTransaction({ data: txData.tx.data, value: txData.tx.value });
    for (const event of txData.txReceipt.logs) {
      // Transfer (index_topic_1 address from, index_topic_2 address to, index_topic_3 uint256 tokenId)
      if (event.address == txData.tx.to && event.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
        const from = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
        const to = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
        let tokenId = ethers.BigNumber.from(event.topics[3]);
        console.log("  ERC-721 transfer of " + event.address + " from " + from + " to " + to + " tokenId " + tokenId);
        // if (from == account && to == account) {
        //   console.log("  ERC-20 - Self Transfer ERC-20:" + event.address + " " + tokens + " tokens");
        // } else if (from == account) {
        //   console.log("  ERC-20 - Sent ERC-20:" + event.address + " " + tokens + " tokens to " + to);
        // } else if (to == account) {
        //   console.log("  ERC-20 - Received ERC-20:" + event.address + " " + tokens + " tokens from " + from);
        // }
      }
    }
  }

  // ERC-721 setApprovalForAll(address operator,bool approved)
  if (txData.tx.data.substring(0, 10) == "0xa22cb465") {
    const interface = new ethers.utils.Interface(ERC721ABI);
    // let decodedData = interface.parseTransaction({ data: txData.tx.data, value: txData.tx.value });
    for (const event of txData.txReceipt.logs) {
      // ApprovalForAll (index_topic_1 address owner, index_topic_2 address operator, bool approved)
      if (event.address == txData.tx.to && event.topics[0] == "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31") {
        const owner = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
        const operator = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
        let approved = ethers.BigNumber.from(event.data) > 0;
        console.log("  ERC-721 transfer of " + event.address + " owner " + owner + " operator " + operator + " approved " + approved);
        // if (from == account && to == account) {
        //   console.log("  ERC-20 - Self Transfer ERC-20:" + event.address + " " + tokens + " tokens");
        // } else if (from == account) {
        //   console.log("  ERC-20 - Sent ERC-20:" + event.address + " " + tokens + " tokens to " + to);
        // } else if (to == account) {
        //   console.log("  ERC-20 - Received ERC-20:" + event.address + " " + tokens + " tokens from " + from);
        // }
      }
    }
  }

  if (txData.tx.to in _CUSTOMACCOUNTS) {
    const accountInfo = _CUSTOMACCOUNTS[txData.tx.to];
    console.log("  " + JSON.stringify(accountInfo.name));
    if (accountInfo.process) {
      accountInfo.process(txData, events, results);
    }
    results.ethPaid = ethers.BigNumber.from(txData.tx.value).toString();
    // results.mask = _CUSTOMACCOUNTS[account].mask;
    // results.symbol = _CUSTOMACCOUNTS[account].symbol;
    // results.name = _CUSTOMACCOUNTS[account].name;
    // results.decimals = _CUSTOMACCOUNTS[account].decimals;
  // } else {
  //   const erc721Helper = new ethers.Contract(ERC721HELPERADDRESS, ERC721HELPERABI, provider); // network.erc721HelperAddress
  }
  return results;
}