function getTokenContractInfo(contract, accounts) {
  // console.log("getTokenContractInfo - contract: " + contract);
  if (contract in accounts) {
    const account = accounts[contract];
    // console.log(JSON.stringify(account));
    return { name: account.contract.name, symbol: account.contract.symbol, decimals: account.contract.decimals };
  }
  return { name: "Unknown", symbol: "Unknown", decimals: 18 };
}

function getEvents(txData) {
  const seaportInterface = new ethers.utils.Interface(_CUSTOMACCOUNTS["0x00000000006c3852cbEf3e08E8dF289169EdE581"].abi);
  const blurInterface = new ethers.utils.Interface(_CUSTOMACCOUNTS["0x000000000000Ad05Ccc4F10045630fb830B95127"].abi);
  const wyvernInterface = new ethers.utils.Interface(_CUSTOMACCOUNTS["0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b"].abi);
  const looksRareInterface = new ethers.utils.Interface(_CUSTOMACCOUNTS["0x59728544B08AB483533076417FbBB2fD0B17CE3a"].abi);
  const x2y2Interface = new ethers.utils.Interface(_CUSTOMACCOUNTS["0x74312363e45DCaBA76c59ec49a7Aa8A65a67EeD3"].abi);
  const erc20Events = [];
  const erc721Events = [];
  const erc1155Events = [];
  const nftExchangeEvents = [];
  const erc20FromMap = {};
  const erc20ToMap = {};
  for (const event of txData.txReceipt.logs) {
    // console.log(JSON.stringify(event));
    // ERC-20 event Transfer(address indexed _from, address indexed _to, uint256 _value)
    // ERC-721 event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
    // CryptoVoxels ERC-721 @ 0x79986aF15539de2db9A5086382daEdA917A9CF0C uses ERC-20 style
    // CryptoKitties ERC-721 @ 0x06012c8cf97BEaD5deAe237070F9587f8E7A266d has unindexed parameters
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
      // ERC-721 Transfer, including CryptoVoxels & CryptoKitties
      if (event.topics.length == 4 || event.address == "0x79986aF15539de2db9A5086382daEdA917A9CF0C" || event.address == "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d") {
        erc721Events.push({ logIndex: event.logIndex, contract: event.address, from, to, tokenId: tokensOrTokenId });
        // ERC-20 Transfer
      } else {
        erc20Events.push({ logIndex: event.logIndex, contract: event.address, from, to, tokens: tokensOrTokenId });
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
      // ERC-1155 TransferSingle (index_topic_1 address _operator, index_topic_2 address _from, index_topic_3 address _to, uint256 _id, uint256 _value)
    } else if (event.topics[0] == "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62") {
      const operator = ethers.utils.getAddress("0x" + event.topics[1].substring(26));
      const from = ethers.utils.getAddress("0x" + event.topics[2].substring(26));
      const to = ethers.utils.getAddress("0x" + event.topics[3].substring(26));
      const tokenId = ethers.BigNumber.from(event.data.substring(0, 66)).toString();
      const tokens = ethers.BigNumber.from("0x" + event.data.substring(67, 130)).toString();
      erc1155Events.push({ logIndex: event.logIndex, contract: event.address, operator, from, to, tokenId, tokens });
      // Seaport
    } else if (event.address == "0x00000000006c3852cbEf3e08E8dF289169EdE581") {
      const log = seaportInterface.parseLog(event);
      if (log.name == "OrderFulfilled") {
        const [orderHash, offerer, zone, recipient, offer, consideration] = log.args;
        const offers = [];
        const considerations = [];
        for (let i = 0; i < offer.length; i++) {
          const [itemType, token, identifier, amount] = offer[i];
          offers.push({ itemType, token, identifier: ethers.BigNumber.from(identifier).toString(), amount: ethers.BigNumber.from(amount).toString() });
        }
        for (let i = 0; i < consideration.length; i++) {
          const [itemType, token, identifier, amount, recipient] = consideration[i];
          considerations.push({ itemType, token, identifier: ethers.BigNumber.from(identifier).toString(), amount: ethers.BigNumber.from(amount).toString(), recipient });
        }
        nftExchangeEvents.push({ logIndex: event.logIndex, contract: event.address, exchange: "Seaport", name: "OrderFulfilled", orderHash, offerer, zone, offers, considerations });
      }
      // Blur
    } else if (event.address == "0x000000000000Ad05Ccc4F10045630fb830B95127") {
      const log = blurInterface.parseLog(event);
      // event OrdersMatched(
      //     address indexed maker,
      //     address indexed taker,
      //     Order sell,
      //     bytes32 sellHash,
      //     Order buy,
      //     bytes32 buyHash
      // );
      // struct Order {
      //     address trader;
      //     Side side;
      //     address matchingPolicy;
      //     address collection;
      //     uint256 tokenId;
      //     uint256 amount;
      //     address paymentToken;
      //     uint256 price;
      //     uint256 listingTime;
      //     /* Order expiration timestamp - 0 for oracle cancellations. */
      //     uint256 expirationTime;
      //     Fee[] fees;
      //     uint256 salt;
      //     bytes extraParams;
      // }
      // struct Fee {
      //     uint16 rate;
      //     address payable recipient;
      // }
      if (log.name == "OrdersMatched") {
        const [maker, taker, sell, sellHash, buy, buyHash] = log.args;
        let [trader, side, matchingPolicy, collection, tokenId, amount, paymentToken, price, listingTime, expirationTime, fees, salt, extraParams] = sell;
        const sellData = {
          trader,
          side,
          matchingPolicy,
          collection,
          tokenId: ethers.BigNumber.from(tokenId).toString(),
          amount: ethers.BigNumber.from(amount).toString(),
          paymentToken,
          price: ethers.BigNumber.from(price).toString(),
          listingTime: ethers.BigNumber.from(listingTime).toString(),
          expirationTime: ethers.BigNumber.from(expirationTime).toString(),
          fees, // TODO
          salt: ethers.BigNumber.from(salt).toString(),
          extraParams,
        };
        [trader, side, matchingPolicy, collection, tokenId, amount, paymentToken, price, listingTime, expirationTime, fees, salt, extraParams] = buy;
        const buyData = {
          trader,
          side,
          matchingPolicy,
          collection,
          tokenId: ethers.BigNumber.from(tokenId).toString(),
          amount: ethers.BigNumber.from(amount).toString(),
          paymentToken,
          price: ethers.BigNumber.from(price).toString(),
          listingTime: ethers.BigNumber.from(listingTime).toString(),
          expirationTime: ethers.BigNumber.from(expirationTime).toString(),
          fees, // TODO
          salt: ethers.BigNumber.from(salt).toString(),
          extraParams,
        };
        nftExchangeEvents.push({ logIndex: event.logIndex, contract: event.address, exchange: "Blur", name: "OrdersMatched", maker, taker, sell: sellData, sellHash, buy: buyData, buyHash });
      }
      // WyvernExchange
    } else if (event.address == "0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b") {
      const log = wyvernInterface.parseLog(event);
      if (log.name == "OrdersMatched") {
        const [buyHash, sellHash, maker, taker, price, metadata] = log.args;
        nftExchangeEvents.push({ logIndex: event.logIndex, contract: event.address, exchange: "WyvernExchange", name: "OrdersMatched", maker, taker, price: ethers.BigNumber.from(price).toString(), metadata });
      }
      // LooksRareExchange
    } else if (event.address == "0x59728544B08AB483533076417FbBB2fD0B17CE3a") {
      const log = looksRareInterface.parseLog(event);
      if (log.name == "TakerAsk") {
        const [orderHash, orderNonce, taker, maker, strategy, currency, collection, tokenId, amount, price] = log.args;
        nftExchangeEvents.push({
          logIndex: event.logIndex,
          contract: event.address,
          exchange: "LooksRareExchange",
          name: "TakerAsk",
          orderHash,
          orderNonce: ethers.BigNumber.from(orderNonce).toString(),
          taker,
          maker,
          strategy,
          currency,
          collection,
          tokenId: ethers.BigNumber.from(tokenId).toString(),
          amount: ethers.BigNumber.from(amount).toString(),
          price: ethers.BigNumber.from(price).toString(),
        });
        // TODO: RoyaltyPayment & TakerBid?
      } else if (log.name != "RoyaltyPayment") {
        console.log("LooksRareExchange: " + JSON.stringify(log));
      }
      // X2Y2_r1
    } else if (event.address == "0x74312363e45DCaBA76c59ec49a7Aa8A65a67EeD3") {
      const log = x2y2Interface.parseLog(event);
      if (log.name == "EvProfit") {
        const [itemHash, currency, to, amount] = log.args;
        nftExchangeEvents.push({
          logIndex: event.logIndex,
          contract: event.address,
          exchange: "X2Y2_r1",
          name: "EvProfit",
          itemHash,
          currency,
          to,
          amount: ethers.BigNumber.from(amount).toString(),
        });
      } else if (log.name == "EvInventory") {
        const [itemHash, maker, taker, orderSalt, settleSalt, intent, delegateType, deadline, currency, dataMask, item, detail] = log.args;
        const [price, data] = item;
        const [op, orderIdx, itemIdx, price1, itemHash1, executionDelegate, dataReplacement, bidIncentivePct, aucMinIncrementPct, aucIncDurationSecs, fees] = detail;
        const feesData = [];
        for (let i = 0; i < fees.length; i++) {
          const [percentage, to] = fees[i];
          feesData.push({ percentage: ethers.BigNumber.from(percentage).toString(), to });
        }
        nftExchangeEvents.push({
          logIndex: event.logIndex,
          contract: event.address,
          exchange: "X2Y2_r1",
          name: "EvInventory",
          itemHash,
          maker,
          taker,
          orderSalt: ethers.BigNumber.from(orderSalt).toString(),
          settleSalt: ethers.BigNumber.from(settleSalt).toString(),
          intent: ethers.BigNumber.from(intent).toString(),
          delegateType: ethers.BigNumber.from(delegateType).toString(),
          delegateType: ethers.BigNumber.from(delegateType).toString(),
          currency,
          dataMask,
          item: {
            price: ethers.BigNumber.from(price).toString(),
            data,
          },
          detail: {
            op,
            orderIdx: ethers.BigNumber.from(orderIdx).toString(),
            itemIdx: ethers.BigNumber.from(itemIdx).toString(),
            price: ethers.BigNumber.from(price1).toString(),
            itemHash,
            executionDelegate,
            dataReplacement,
            bidIncentivePct: ethers.BigNumber.from(bidIncentivePct).toString(),
            aucMinIncrementPct: ethers.BigNumber.from(aucMinIncrementPct).toString(),
            aucIncDurationSecs: ethers.BigNumber.from(aucIncDurationSecs).toString(),
            fees: feesData,
          },
        });
      }
    }
  }
  return { erc20Events, erc721Events, erc1155Events, erc20FromMap, erc20ToMap, nftExchangeEvents };
}

function accumulateTxResults(accumulatedData, txData, results) {
  if (!('ethBalance' in accumulatedData)) {
    accumulatedData.ethBalance = ethers.BigNumber.from(0);
  }
  accumulatedData.ethBalancePrev = accumulatedData.ethBalance;
  accumulatedData.ethBalance = accumulatedData.ethBalance.add(results.ethReceived).sub(results.ethPaid).sub(results.txFee);
  const DEBUG = false;
  if (results.info) {
    if (!DEBUG) {
      console.log(moment.unix(txData.timestamp).format("YYYY-MM-DD HH:mm:ss") + " " + results.info);
    }
  } else {
    console.log(moment.unix(txData.timestamp).format("YYYY-MM-DD HH:mm:ss") + " TODO " + txData.tx.from.substring(0, 12) + (txData.tx.to && (" -> " + txData.tx.to) || ''));
  }
  if (!DEBUG || !results.info) {
    console.log("  " + txData.tx.blockNumber + " " + txData.tx.transactionIndex + " " + txData.tx.hash +
      " " + ethers.utils.formatEther(accumulatedData.ethBalance) +
      "Ξ = " + ethers.utils.formatEther(accumulatedData.ethBalancePrev) +
      "Ξ+" + ethers.utils.formatEther(results.ethReceived) +
      "Ξ-" + ethers.utils.formatEther(results.ethPaid) +
      "Ξ-" + ethers.utils.formatEther(results.txFee) +
      "Ξ");
  }
}

function parseTx(chainId, account, accounts, txData) {
  // console.log("parseTx: " + JSON.stringify(account));
  const results = {};
  const msgValue = ethers.BigNumber.from(txData.tx.value).toString();
  const gasUsed = ethers.BigNumber.from(txData.txReceipt.gasUsed);
  const txFee = gasUsed.mul(txData.txReceipt.effectiveGasPrice);
  results.gasUsed = gasUsed;
  results.txFee = txData.tx.from == account ? txFee : 0;
  results.ethReceived = 0;
  results.ethPaid = 0;
  const events = getEvents(txData);
  if (events.nftExchangeEvents.length > 0) {
    console.log("nftExchangeEvents: " + JSON.stringify(events.nftExchangeEvents, null, 2));
  }

  // TODO: Identify internal transfers?
  // EOA to EOA ETH transfer
  if (gasUsed == 21000) {
    if (txData.tx.from == account && txData.tx.to == account) {
      results.info = "Cancel tx";
    } else if (txData.tx.from == account) {
      results.ethPaid = msgValue;
      results.info = "Sent " + ethers.utils.formatEther(msgValue) + "Ξ to " + txData.tx.to;
    } else if (txData.tx.to == account) {
      results.ethReceived = msgValue;
      results.info = "Received " + ethers.utils.formatEther(msgValue) + "Ξ from " + txData.tx.from;
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
    for (const event of txData.txReceipt.logs) {
      if (event.address == txData.tx.to && event.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
        const from = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
        const to = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
        const tokens = event.topics.length == 3 ? ethers.BigNumber.from(event.data) : ethers.BigNumber.from(event.topics[3]);
        if (from == account && to == account) {
          results.info = "Self Transfer ERC-20:" + event.address + " " + tokens;
        } else if (from == account) {
          results.info = "Sent ERC-20:" + event.address + " " + tokens + " to " + to;
        } else if (to == account) {
          results.info = "Received ERC-20:" + event.address + " " + tokens + " from " + from;
        }
      }
    }
  }

  // ERC-721 setApprovalForAll(address operator,bool approved)
  if (!results.info && txData.tx.data.substring(0, 10) == "0xa22cb465") {
    for (const event of txData.txReceipt.logs) {
      // ApprovalForAll (index_topic_1 address owner, index_topic_2 address operator, bool approved)
      if (event.address == txData.tx.to && event.topics[0] == "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31") {
        const owner = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
        const operator = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
        let approved = ethers.BigNumber.from(event.data) > 0;
        const info = getTokenContractInfo(event.address, accounts);
        results.info = "ERC-721 " + info.symbol + " setApprovalForAll(" + operator + ", " + approved + ")";
      }
    }
  }

  // ERC-721 safeTransferFrom(address from, address to, uint256 tokenId) && transferFrom(address from, address to, uint256 tokenId)
  if (!results.info && (txData.tx.data.substring(0, 10) == "0x42842e0e" || txData.tx.data.substring(0, 10) == "0x23b872dd")) {
    for (const event of txData.txReceipt.logs) {
      // Transfer (index_topic_1 address from, index_topic_2 address to, index_topic_3 uint256 tokenId)
      if (event.address == txData.tx.to && event.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
        const from = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
        const to = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
//        let tokenId = ethers.BigNumber.from(event.topics[3]);
        const tokenId = event.topics.length == 3 ? ethers.BigNumber.from(event.data) : ethers.BigNumber.from(event.topics[3]);
        // console.log("  ERC-721 transfer of " + event.address + " from " + from + " to " + to + " tokenId " + tokenId);
        const info = getTokenContractInfo(event.address, accounts);
        if (from == account && to == account) {
          results.info = "Self Transfer ERC-721:" + info.name + " " + tokenId;
        } else if (from == account) {
          results.info = "Sent ERC-721:" + info.name + " " + tokenId + " to " + to;
        } else if (to == account) {
          results.info = "Received ERC-721:" + info.name + " " + tokenId + " from " + from;
        }
      }
    }
  }

  // ERC-1155 safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes _data)
  if (!results.info && txData.tx.data.substring(0, 10) == "0xf242432a") {
    for (const event of txData.txReceipt.logs) {
      // Transfer (index_topic_1 address from, index_topic_2 address to, index_topic_3 uint256 tokenId)
      if (event.address == txData.tx.to && event.topics[0] == "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62") {
        const operator = ethers.utils.getAddress("0x" + event.topics[1].substring(26));
        const from = ethers.utils.getAddress("0x" + event.topics[2].substring(26));
        const to = ethers.utils.getAddress("0x" + event.topics[3].substring(26));
        const tokenId = ethers.BigNumber.from(event.data.substring(0, 66)).toString();
        const tokens = ethers.BigNumber.from("0x" + event.data.substring(67, 130)).toString();
        const info = getTokenContractInfo(event.address, accounts);
        // console.log("    ERC-1155 transfer of " + info.symbol + ", from: " + from + ", to: " + to + ", tokenId: " + tokenId + ", tokens: " + tokens);
        if (from == account && to == account) {
          results.info = "Self Transfer ERC-1155:" + info.name + " " + tokenId + " x " + tokens;
        } else if (from == account) {
          results.info = "Sent ERC-1155:" + info.name + " " + tokenId + " x " + tokens + " to " + to;
        } else if (to == account) {
          results.info = "Received ERC-1155:" + info.name + " " + tokenId + " x " + tokens + " from " + from;
        }
      }
    }
  }
  if (!results.info && txData.tx.to in _CUSTOMACCOUNTS) {
    const accountInfo = _CUSTOMACCOUNTS[txData.tx.to];
    // console.log("  " + JSON.stringify(accountInfo.name));
    if (accountInfo.process) {
      accountInfo.process(txData, account, accounts, events, results);
      if (!results.info) {
        console.log("  TODO: " + txData.tx.hash + " " + JSON.stringify(accountInfo.name));
      }
    }
  }

  if (!results.info) {
    if (msgValue == 0 && (Object.keys(events.erc20FromMap).length < 3) && (Object.keys(events.erc20ToMap).length > 3) && (account in events.erc20ToMap)) {
      const receivedERC20Events = events.erc20Events.filter(e => e.to == account);
      if (receivedERC20Events.length == 1) {
        results.info = "Airdropped ERC-20:" + receivedERC20Events[0].contract + " " + receivedERC20Events[0].tokens + " tokens";
      } else {
        // TODO: Other cases?
        console.log("  Received Airdrop: " + JSON.stringify(receivedERC20Events));
      }
    }
    // TODO:
    // if (erc1155Events.length > 0) {
    //   console.log("ERC-1155: " + JSON.stringify(erc1155Events));
    // }
  }

  // // Simple ERC-20 Purchase
  // if (!results.info && msgValue > 0 && txData.tx.from == account) {
  //   const receivedERC20Events = events.erc20Events.filter(e => e.to == account);
  //   if (receivedERC20Events.length == 1) {
  //       results.ethPaid = msgValue;
  //       results.info = "Purchased ERC-20:" + receivedERC20Events[0].contract + " " + receivedERC20Events[0].tokens + " for " + ethers.utils.formatEther(msgValue) + "Ξ";
  //   } else {
  //     // TODO Bulk
  //     // console.log("receivedERC20Events: " + JSON.stringify(receivedERC20Events));
  //   }
  // }

  // ERC-721 Mints
  const MINTSIGS = {
    "0xa0712d68": true, // mint(uint256 mintedAmount)
  };
  // if (!results.info && txData.tx.data.substring(0, 10) in GENERALCONTRACTMAINTENANCESIGS) {
  //   results.info = "General contract maintenance TODO";
  // }
  if (!results.info && txData.tx.from == account && txData.tx.data.substring(0, 10) in MINTSIGS) {
    const receivedERC721Events = events.erc721Events.filter(e => e.to == account);
    if (receivedERC721Events.length > 0) {
      const tokenIds = receivedERC721Events.map(e => e.tokenId);
      const info = getTokenContractInfo(receivedERC721Events[0].contract, accounts);
      results.ethPaid = msgValue;
      results.info = "ERC-721 Mint " + receivedERC721Events.length + "x " + tokenIds.join(", ") + " for " + ethers.utils.formatEther(msgValue) + "Ξ";
    }
  }

  // Simple ERC-721 Purchase
  if (!results.info && msgValue > 0 && txData.tx.from == account) {
    const receivedERC721Events = events.erc721Events.filter(e => e.to == account);
    if (receivedERC721Events.length == 1) {
        results.ethPaid = msgValue;
        const info = getTokenContractInfo(receivedERC721Events[0].contract, accounts);
        results.info = "Purchased ERC-721 " + info.symbol + " " + receivedERC721Events[0].tokenId + " for " + ethers.utils.formatEther(msgValue) + "Ξ";
    } else {
      // TODO Bulk
      // console.log("receivedERC721Events: " + JSON.stringify(receivedERC721Events));
    }
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
        results.ethReceived = ethers.BigNumber.from(event.data);
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

  // Umswap swap(uint256[] inTokenIds,uint256[] outTokenIds)
  if (!results.info && txData.tx.data.substring(0, 10) == "0x0a3cb72e") {
    results.info = "Umswap swap() TODO";
  }

  // Umswap newUmswap(address collection,string name,uint256[] tokenIds)
  if (!results.info && txData.tx.data.substring(0, 10) == "0x8945f054") {
    results.info = "Umswap newUmswap() TODO";
  }

  // BokkyPooBahsFixedSupplyTokenFactory deployTokenContract(string symbol, string name, uint8 decimals, uint256 totalSupply)
  if (!results.info && txData.tx.data.substring(0, 10) == "0xcdaca7d5") {
    results.info = "BokkyPooBahsFixedSupplyTokenFactory deployTokenContract() TODO";
  }

  // BokkyPooBahsFixedSupplyTokenFactory transferOwnership(address _newOwner)
  if (!results.info && txData.tx.data.substring(0, 10) == "0xf2fde38b") {
    results.info = "BokkyPooBahsFixedSupplyTokenFactory transferOwnership() TODO";
  }

  // BokkyPooBahsFixedSupplyTokenFactory transferOwnership(address _newOwner)
  if (!results.info && txData.tx.data.substring(0, 10) == "0xd0def521") {
    results.info = "CryptoVoxels Name mint() TODO";
  }

  const GENERALCONTRACTMAINTENANCESIGS = {
    "0xeb32e37e": true, // No contract source
    "0x6c595451": true, // addApp(string appName, address _feeAccount, uint256 _fee)
    "0x73311631": true, // addBrand(address brandAccount, string brandName)
    "0x0a40fb8c": true, // permissionMarker(address marker, bool permission)
  };
  if (!results.info && txData.tx.data.substring(0, 10) in GENERALCONTRACTMAINTENANCESIGS) {
    results.info = "General contract maintenance TODO";
  }

  return results;
}
