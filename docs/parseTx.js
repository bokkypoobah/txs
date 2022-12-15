function getTokenContractInfo(contract, accounts) {
  // console.log("getTokenContractInfo - contract: " + contract);
  let name = null;
  let symbol = null;
  let decimals = 18;
  if (contract in accounts) {
    const account = accounts[contract];
    name = account.contract.name;
    symbol = account.contract.symbol;
    decimals = account.contract.decimals;
  }
  if (name == null || name.length == 0) {
    name = contract;
  }
  if (symbol == null || symbol.length == 0) {
    symbol = "???";
  }
  return { name, symbol, decimals };
}

function getEvents(txData) {
  const erc1155Interface = new ethers.utils.Interface(ERC1155ABI);
  const wethInterface = new ethers.utils.Interface(_CUSTOMACCOUNTS["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"].abi);
  const seaportInterface = new ethers.utils.Interface(_CUSTOMACCOUNTS["0x00000000006c3852cbEf3e08E8dF289169EdE581"].abi);
  const blurInterface = new ethers.utils.Interface(_CUSTOMACCOUNTS["0x000000000000Ad05Ccc4F10045630fb830B95127"].abi);
  const wyvernInterface = new ethers.utils.Interface(_CUSTOMACCOUNTS["0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b"].abi);
  const looksRareInterface = new ethers.utils.Interface(_CUSTOMACCOUNTS["0x59728544B08AB483533076417FbBB2fD0B17CE3a"].abi);
  const x2y2Interface = new ethers.utils.Interface(_CUSTOMACCOUNTS["0x74312363e45DCaBA76c59ec49a7Aa8A65a67EeD3"].abi);
  const nftxInterface = new ethers.utils.Interface(_CUSTOMACCOUNTS["0x0fc584529a2AEfA997697FAfAcbA5831faC0c22d"].abi);
  const ensRegistrarControllerInterface = new ethers.utils.Interface(_CUSTOMACCOUNTS["0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5"].abi);
  const erc20Events = [];
  const wethDepositEvents = [];
  const wethWithdrawalEvents = [];
  const erc721Events = [];
  const erc1155Events = [];
  const erc1155BatchEvents = [];
  const nftExchangeEvents = [];
  const ensEvents = [];
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

      // ERC-1155 TransferBatch (index_topic_1 address operator, index_topic_2 address from, index_topic_3 address to, uint256[] ids, uint256[] values)
    } else if (event.topics[0] == "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb") {
      const log = erc1155Interface.parseLog(event);
      const [operator, from, to, tokenIds, tokens] = log.args;
      erc1155BatchEvents.push({ logIndex: event.logIndex, contract: event.address, operator, from, to, tokenIds, tokens });

      // ENS ETHRegistrarController
    } else if (event.address == "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5") {
      const log = ensRegistrarControllerInterface.parseLog(event);
      if (log.name == "NameRegistered") {
        const [name, label, owner, cost, expires] = log.args;
        ensEvents.push({ logIndex: event.logIndex, contract: event.address, type: log.name, name, label, owner, cost: ethers.BigNumber.from(cost).toString(), expires: ethers.BigNumber.from(expires).toString() });
      } else if (log.name == "NameRenewed") {
        const [name, label, cost, expires] = log.args;
        ensEvents.push({ logIndex: event.logIndex, contract: event.address, type: log.name, name, label, cost: ethers.BigNumber.from(cost).toString(), expires: ethers.BigNumber.from(expires).toString() });
      }
      // WETH
    } else if (event.address == "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2") {
      const log = wethInterface.parseLog(event);
      // Deposit (index_topic_1 address dst, uint256 wad)
      if (event.topics[0] == "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c") {
        const [to, tokens] = log.args;
        wethDepositEvents.push({ logIndex: event.logIndex, contract: event.address, to, tokens: ethers.BigNumber.from(tokens).toString() });
      // Withdrawal (index_topic_1 address src, uint256 wad)
      } else if (event.topics[0] == "0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65") {
        const [from, tokens] = log.args;
        wethWithdrawalEvents.push({ logIndex: event.logIndex, contract: event.address, from, tokens: ethers.BigNumber.from(tokens).toString() });
      }
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
      // WyvernExchange - 2018 version
    } else if (event.address == "0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b") {
      const log = wyvernInterface.parseLog(event);
      if (log.name == "OrdersMatched") {
        const [buyHash, sellHash, maker, taker, price, metadata] = log.args;
        nftExchangeEvents.push({ logIndex: event.logIndex, contract: event.address, exchange: "WyvernExchange", name: "OrdersMatched", maker, taker, price: ethers.BigNumber.from(price).toString(), metadata });
      }
      // WyvernExchange - 2022 version
    } else if (event.address == "0x7f268357A8c2552623316e2562D90e642bB538E5") {
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
      // NFTX
    } else if (event.address == "0x0fc584529a2AEfA997697FAfAcbA5831faC0c22d") {
      const log = nftxInterface.parseLog(event);
      if (log.name == "Buy") {
        const [count, ethSpent, to] = log.args;
        nftExchangeEvents.push({
          logIndex: event.logIndex,
          contract: event.address,
          exchange: "NFTXMarketplaceZap",
          name: "Buy",
          count: ethers.BigNumber.from(count).toString(),
          ethSpent: ethers.BigNumber.from(ethSpent).toString(),
          to,
        });
      } else if (log.name == "Sell") {
        const [count, ethReceived, to] = log.args;
        nftExchangeEvents.push({
          logIndex: event.logIndex,
          contract: event.address,
          exchange: "NFTXMarketplaceZap",
          name: "Sell",
          count: ethers.BigNumber.from(count).toString(),
          ethReceived: ethers.BigNumber.from(ethReceived).toString(),
          to,
        });
      } else if (log.name == "Swap") {
        const [count, ethSpent, to] = log.args;
        nftExchangeEvents.push({
          logIndex: event.logIndex,
          contract: event.address,
          exchange: "NFTXMarketplaceZap",
          name: "Swap",
          count: ethers.BigNumber.from(count).toString(),
          ethSpent: ethers.BigNumber.from(ethSpent).toString(),
          to,
        });
      }
    }
  }
  return { erc20Events, wethDepositEvents, wethWithdrawalEvents, erc721Events, erc1155Events, erc1155BatchEvents, erc20FromMap, erc20ToMap, nftExchangeEvents, ensEvents };
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
  // if (events.nftExchangeEvents.length > 0) {
  //   console.log("nftExchangeEvents: " + JSON.stringify(events.nftExchangeEvents, null, 2));
  // }
  // if (events.ensEvents.length > 0) {
  //   console.log("ensEvents: " + JSON.stringify(events.ensEvents, null, 2));
  // }

  if (txData.txReceipt.status == 0) {
    results.info = "Error tx with status 0";
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

  // ENS Registrations and renewals, can be executed via ENS Batch Renewal, ENS.Vision, ...
  if (!results.info && events.ensEvents.length > 0) {
    const registrationEvents = events.ensEvents.filter(e => e.type == "NameRegistered");
    const renewalEvents = events.ensEvents.filter(e => e.type == "NameRenewed");
    let totalCost = ethers.BigNumber.from(0);
    const names = [];
    if (registrationEvents.length > 0) {
      for (const event of registrationEvents) {
        names.push(event.name + ".eth");
        totalCost = totalCost.add(event.cost);
      }
      results.info = "Registered ENS " + names.length + "x " + names.join(", ") + " for " + ethers.utils.formatEther(totalCost) + "Ξ";
    } else if (renewalEvents.length > 0) {
      for (const event of renewalEvents) {
        names.push(event.name + ".eth");
        totalCost = totalCost.add(event.cost);
      }
      results.info = "Renewed ENS " + names.length + "x " + names.join(", ") + " for " + ethers.utils.formatEther(totalCost) + "Ξ";
    }
    results.ethPaid = totalCost;
  }


  if (!results.info && txData.tx.to in _CUSTOMACCOUNTS) {
    const accountInfo = _CUSTOMACCOUNTS[txData.tx.to];
    // console.log("  " + JSON.stringify(accountInfo.name));
    if (accountInfo.process) {
      accountInfo.process(txData, account, accounts, events, results);
      if (!results.info) {
        console.log("  TOODO: " + txData.tx.hash + " " + JSON.stringify(accountInfo.name));
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
  }

  const CLAIMERC20AIRDROPS = {
    "0xca21b177": true, // claim(bytes32[] proof_, address claimant_, uint256 claim_) 0xed39DAFd2B2a624fE43A5BbE76e0Dae4E4E621ef
    "0xabf2ebd8": true, // claim(uint256 amountV, bytes32 r, bytes32 s) 0x3b484b82567a09e2588A13D54D032153f0c0aEe0
    "0x6ba4c138": true, // claim(uint256[] tokenIndices) 0x8A9c4dfe8b9D8962B31e4e16F8321C44d48e246E
    "0x4972a7a7": true, // claim(uint256 amount,bytes32[] merkleProof,tuple makerAsk,bool isERC721) 0xA35dce3e0E6ceb67a30b8D7f4aEe721C949B5970
  };
  if (!results.info && txData.tx.from == account && txData.tx.data.substring(0, 10) in CLAIMERC20AIRDROPS) {
    const receivedERC20Events = events.erc20Events.filter(e => e.to == account);
    if (receivedERC20Events.length == 1) {
      const info = getTokenContractInfo(receivedERC20Events[0].contract, accounts);
      results.info = "Claimed Airdrop ERC-20:" + info.name + " " + ethers.utils.formatUnits(receivedERC20Events[0].tokens, info.decimals) + " tokens";
    } else {
      // TODO: Other cases?
      // console.log("  Received Airdrop: " + JSON.stringify(receivedERC20Events));
    }
  }

  const ERC721DROP = {
    "0x7884af44": true, // mintBase(address to, string uri) 0xA8121B153c77cA4dd1da3a9D7cDC4729129c8c6D
  };
  if (!results.info && txData.tx.from != account && txData.tx.data.substring(0, 10) in ERC721DROP) {
    const receivedERC721Events = events.erc721Events.filter(e => e.to == account);
    if (receivedERC721Events.length == 1) {
      const info = getTokenContractInfo(receivedERC721Events[0].contract, accounts);
      results.info = "Received Drop of ERC-721:" + info.name + " x" + receivedERC721Events.length + " " + receivedERC721Events[0].tokenId;
    } else {
      // TODO: Other cases?
      // console.log("  Received Airdrop: " + JSON.stringify(receivedERC20Events));
    }
  }

  // ERC-721 Mints
  const MINTSIGS = {
    // "0xa0712d68": true, // mint(uint256 mintedAmount)
    // "0x3f81449a": true, // mintTrunk(uint256 randomSeed, bool isBasic)
    // "0xa903f6c3": true, // mintBatchFurnitures(uint256[] ids, uint256[] amounts) 0xb644476e44A797Db3B8a6A16f2e63e8D5a541b67
    // "0xdb7fd408": true, // mint(uint256 _amountToMint, bytes _data) 0x7685376aF33104dD02be287ed857a19Bb4A24EA2
    // "0xc242452d": true, // adoptDog(uint256 baycTokenId) 0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623
    // "0x42ece838": true, // mintNFTWithETH(uint256[] connectedNftIndices, string nftType) 0x433B2E291720CD5714dfAA02883Fb8FAc1061458
    // "0xd5fbb40f": true, // mintGLICPIXV2_BATCH(uint8 _collection, uint256[] tokenIds) 0x1C60841b70821dcA733c9B1a26dBe1a33338bD43
    // "0x379607f5": true, // claim(uint256 megarares_count) 0x31eAa2E93D7AFd237F87F30c0Dbd3aDEB9934f1B
    // "0xd47f030d": true, // mintMultiple(uint256[] rescueOrders) 0x1e9385eE28c5C7d33F3472f732Fb08CE3ceBce1F
    // "0xe7d3fe6b": true, // mint(uint256 tokenId0, uint256 tokenId1, address otherToken) 0x6aDA46d38A2F3Bf2309432d3Db9A81685Cb96fac
    // "0x1249c58b": true, // mint() 0xe0fA9Fb0e30ca86513642112BEE1CBbAA2A0580d
    // "0x6bf2a62a": true, // mint(uint256 pSaleId, address pAccount, uint256 pMintAmount, bytes32[] pProof) 0x674D37ac70E3a946B4a3Eb85EEadF3a75407EE41
    // "0x5befbed3": true, // ? 0x3eC9583F3f298f28b02D4312015B27360FadF88f
    // "0x3c168eab": true, // mintNFT(address receiver, uint256 nb_nft) 0x7DAfE71dB8CF7edb682E762529c8af78fEd569c5
    // "0xb155d7fa": true, // mintRandom() 0xca3CDA3B5a8B36356568A573bf10C3EB0Fc3238C
    // "0x40c10f19": true, // mint(address _to, uint256 _count) 0x8d0D79D39475187F3B51Cfc02d2dc516C378f865
    // "0x43508b05": true, // batchMint(address account, uint256 amount) 0x009d6A428AC3797888ceAF7CA4AA2aa113655500
    // "0xa71bbebe": true, // mint(uint32 count) 0x4e83Fb543E8fFa0E19929f0C754ba6EAee56190b
    // "0xe3c0cee5": true, // mintBatch(tuple[] mintingBatch) 0x2d255b756dD75a11D75cf701aBaD7c6D64b0AeDD
    // "0x927f59ba": true, // mintBatch(address[] to) 0x135511599D8D78e4E5D2ed7E224b54D80ff97309
    // "0xbd075b84": true, // mint(address[] recipients) 0x26F4465DdBDFA4c62dE1982Dbf68f5055c6a959a
    // "0x39fd5d70": true, // mint(uint256 pDrop, uint256 pTokenId, address pRecipient, uint256 amount, bytes32[] pProof) 0x11B197e078e41aF41Bc1d9e03407090e61e40BAA
  };
  if (!results.info && events.nftExchangeEvents.length == 0 /*txData.tx.from == account && txData.tx.data.substring(0, 10) in MINTSIGS*/) {
    const receivedERC721Events = events.erc721Events.filter(e => e.to == account);
    const receivedERC1155Events = events.erc1155Events.filter(e => e.to == account);
    const receivedERC1155BatchEvents = events.erc1155BatchEvents.filter(e => e.to == account);
    if (receivedERC721Events.length > 0) {
      const tokenIds = receivedERC721Events.map(e => e.tokenId);
      const info = getTokenContractInfo(receivedERC721Events[0].contract, accounts);
      results.ethPaid = msgValue;
      results.info = "Minted ERC-721:" + info.name + " x" + receivedERC721Events.length + " " + tokenIds.join(", ") + " for " + ethers.utils.formatEther(msgValue) + "Ξ";
    } else if (receivedERC1155Events.length > 0) {
      const tokenIds = receivedERC1155Events.map(e => e.tokenId);
      const info = getTokenContractInfo(receivedERC1155Events[0].contract, accounts);
      results.ethPaid = msgValue;
      results.info = "Minted ERC-1155:" + info.name + " x" + receivedERC1155Events.length + " " + tokenIds.join(", ") + " for " + ethers.utils.formatEther(msgValue) + "Ξ";
    } else if (receivedERC1155BatchEvents.length > 0) {
      const info = getTokenContractInfo(receivedERC1155BatchEvents[0].contract, accounts);
      results.ethPaid = msgValue;
      results.info = "Batch Minted ERC-1155:" + info.name + " x" + receivedERC1155BatchEvents.length + " " + receivedERC1155BatchEvents[0].tokenIds.join(", ") + " for " + ethers.utils.formatEther(msgValue) + "Ξ";
    }
  }

  // ETH bulk transfers as internals
  const BULKINTERNALREFUNDS = {
    "0xfe132c63": true, // refundDifferenceToBidders(address[] bidderAddresses) 0xe0fA9Fb0e30ca86513642112BEE1CBbAA2A0580d
  };
  if (!results.info && txData.tx.from != account && txData.tx.data.substring(0, 10) in BULKINTERNALREFUNDS) {
    const accountData = accounts[account];
    let ethBalance = ethers.BigNumber.from(0);
    for (const [txHash, traceData] of Object.entries(accountData.internalTransactions)) {
      if (txHash == txData.tx.hash) {
        for (const [traceId, internalTransaction] of Object.entries(traceData)) {
          const to = ethers.utils.getAddress(internalTransaction.to);
          if (to == account) {
            ethBalance = ethBalance.add(internalTransaction.value);
          }
        }
      }
    }
    if (ethBalance > 0) {
      results.info = "Received internal transaction refund of " + ethers.utils.formatEther(ethBalance) + "Ξ from " + txData.tx.to;
    }
  }

  // We purchase ERC-721 & ERC-1155
  if (!results.info && events.nftExchangeEvents.length > 0 && txData.tx.from == account) {
    const receivedERC721Events = events.erc721Events.filter(e => e.to == account);
    const receivedERC1155Events = events.erc1155Events.filter(e => e.to == account);
    if (receivedERC721Events.length == 1) {
      results.ethPaid = msgValue;
      const info = getTokenContractInfo(receivedERC721Events[0].contract, accounts);
      results.info = "Purchased ERC-721 " + info.name + " " + receivedERC721Events[0].tokenId + " for " + ethers.utils.formatEther(msgValue) + "Ξ";
    } else if (receivedERC1155Events.length == 1) {
      results.ethPaid = msgValue;
      const info = getTokenContractInfo(receivedERC1155Events[0].contract, accounts);
      results.info = "Purchased ERC-1155 " + info.name + " " + receivedERC1155Events[0].tokenId + " x " + receivedERC1155Events[0].tokens + " for " + ethers.utils.formatEther(msgValue) + "Ξ";
    } else if (events.nftExchangeEvents.length == 1 && (receivedERC721Events.length + receivedERC1155Events.length) > 1) {
      results.ethPaid = msgValue;
      const purchased = [];
      for (const event of receivedERC721Events) {
        const info = getTokenContractInfo(event.contract, accounts);
        purchased.push(info.name + ":" + event.tokenId);
      }
      for (const event of receivedERC1155Events) {
        const info = getTokenContractInfo(event.contract, accounts);
        purchased.push(info.name + ":" + event.tokenId);
      }
      results.info = "Purchased OS Bundle " + purchased.join(", ") + " for " + ethers.utils.formatEther(msgValue) + "Ξ";
    } else {
      // TODO Bulk
      // console.log("receivedERC721Events: " + JSON.stringify(receivedERC721Events));
    }
  }

  console.log("erc721Events: " + JSON.stringify(events.erc721Events));
  console.log("erc1155Events: " + JSON.stringify(events.erc1155Events));
  console.log("nftExchangeEvents: " + JSON.stringify(events.nftExchangeEvents));

  // Other account purchased our ERC-721
  if (!results.info && events.nftExchangeEvents.length > 0 && txData.tx.from != account) {
    console.log("Here");
    const sentERC721Events = events.erc721Events.filter(e => e.from == account);
    console.log("sentERC721Events: " + JSON.stringify(sentERC721Events));
    if (sentERC721Events.length == 1 && events.nftExchangeEvents.length == 1) {
      const price = ('price' in events.nftExchangeEvents[0]) ? events.nftExchangeEvents[0].price : 0;
      // TODO: Need to search for internal transaction
      results.ethReceived = price;
      const info = getTokenContractInfo(sentERC721Events[0].contract, accounts);
      results.info = "Sold ERC-721 " + info.name + " " + sentERC721Events[0].tokenId + " for " + price ? ethers.utils.formatEther(price) : "0" + "Ξ -fees to " + sentERC721Events[0].to;
    } else {
      // TODO Bulk
      // console.log("receivedERC721Events: " + JSON.stringify(receivedERC721Events));
    }
  }

  // We accept WETH bid for our ERC-721
  if (!results.info && events.nftExchangeEvents.length > 0 && txData.tx.from == account) {
    const sentERC721Events = events.erc721Events.filter(e => e.from == account);
    let wethBalance = ethers.BigNumber.from(0);
    for (const event of events.erc20Events) {
      if (event.contract == "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2") {
        if (event.to == account) {
          wethBalance = wethBalance.add(event.tokens);
        } else if (event.from == account) {
          wethBalance = wethBalance.sub(event.tokens);
        }
      }
    }
    if (sentERC721Events.length == 1 && events.nftExchangeEvents.length == 1) {
      const info = getTokenContractInfo(sentERC721Events[0].contract, accounts);
      results.info = "Sold ERC-721 " + info.name + " " + sentERC721Events[0].tokenId + " for " + ethers.utils.formatEther(wethBalance) + " WETH to " + sentERC721Events[0].to;
    } else {
      // TODO Bulk
      // console.log("receivedERC721Events: " + JSON.stringify(receivedERC721Events));
    }
  }

  const BULKTRANSFERS = {
    "0x3f801f91": true, // Old Opensea Bulk Transfers @ 0xA64528Ce3c465C47258F14106FE903C201b07374
    "0xd9eccc2e": true, // sendToMany(address from, address[] to, uint256 id, uint256 amount, bytes data) @ 0xD9c8e3d79B44679A4837E2D53c5da43Ca582DADf
    "0x54ffbd23": true, // Bulksender.app @ 0xd1917932A7Db6Af687B523D5Db5d7f5c2734763F
    "0xe96c3edb": true, // Bulksender.app @ 0xd1917932A7Db6Af687B523D5Db5d7f5c2734763F
  };
  if (!results.info && txData.tx.data.substring(0, 10) in BULKTRANSFERS) {
    const receivedERC721Events = events.erc721Events.filter(e => e.to == account);
    const sentERC721Events = events.erc721Events.filter(e => e.from == account);
    const receivedERC1155Events = events.erc1155Events.filter(e => e.to == account);
    const sentERC1155Events = events.erc1155Events.filter(e => e.from == account);
    const receivedERC1155BatchEvents = events.erc1155BatchEvents.filter(e => e.to == account);
    const sentERC1155BatchEvents = events.erc1155BatchEvents.filter(e => e.from == account);
    if (receivedERC721Events.length > 0) {
      const tokenIds = receivedERC721Events.map(e => e.tokenId);
      const info = getTokenContractInfo(receivedERC721Events[0].contract, accounts);
      results.info = "Receive Bulk Transfer ERC-721:" + info.name + " x" + receivedERC721Events.length + " " + tokenIds.join(", ") + " from " + receivedERC721Events[0].from;
    } else if (sentERC721Events.length > 0) {
      const tokenIds = sentERC721Events.map(e => e.tokenId);
      const info = getTokenContractInfo(sentERC721Events[0].contract, accounts);
      results.info = "Sent Bulk Transfer ERC-721:" + info.name + " x" + sentERC721Events.length + " " + tokenIds.join(", ") + " to " + sentERC721Events[0].to;
    } else if (receivedERC1155Events.length > 0) {
      const tokenIds = receivedERC1155Events.map(e => e.tokenId);
      const info = getTokenContractInfo(receivedERC1155Events[0].contract, accounts);
      results.info = "Receive Bulk Transfer ERC-1155:" + info.name + " x" + receivedERC1155Events.length + " " + tokenIds.join(", ") + " from " + receivedERC1155Events[0].from;
    } else if (sentERC1155Events.length > 0) {
      const tokenIds = sentERC1155Events.map(e => e.tokenId);
      const info = getTokenContractInfo(sentERC1155Events[0].contract, accounts);
      results.info = "Sent Bulk Transfer ERC-1155:" + info.name + " x" + sentERC1155Events.length + " " + tokenIds.join(", ") + " to " + sentERC1155Events[0].to;
    } else if (receivedERC1155BatchEvents.length > 0) {
      const info = getTokenContractInfo(receivedERC1155BatchEvents[0].contract, accounts);
      results.info = "Receive Bulk Transfer ERC-1155:" + info.name + " x" + receivedERC1155BatchEvents.length + " " + receivedERC1155BatchEvents[0].tokenIds.join(", ") + " from " + receivedERC1155BatchEvents[0].from;
    } else if (sentERC1155BatchEvents.length > 0) {
      const info = getTokenContractInfo(sentERC1155BatchEvents[0].contract, accounts);
      results.info = "Sent Bulk Transfer ERC-1155:" + info.name + " x" + sentERC1155BatchEvents.length + " " + sentERC1155BatchEvents[0].tokenIds.join(", ") + " from " + sentERC1155BatchEvents[0].from;
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
    // "0xeb32e37e": true, // No contract source
    "0x6c595451": "addApp(string appName, address _feeAccount, uint256 _fee)", //
    "0x73311631": "addBrand(address brandAccount, string brandName)", //
    "0x0a40fb8c": "permissionMarker(address marker, bool permission)", //
    "0x34f14c0a": "addEntry(address token, uint8 permission)", //
    "0xddd81f82": "registerProxy()", // OpenSea  0xa5409ec958C83C3f309868babACA7c86DCB077c1
    "0x2385554c": "hatchEgg(uint256 egg)", //  0x7685376aF33104dD02be287ed857a19Bb4A24EA2
    "0x4e71d92d": "claim()", //  0xfdD7399e22918ba7234f5568cc2eF922489F7Ba6 - TODO ERC-20
    "0xfc24100b": "buyAccessories(tuple[] orders)", // 0x8d33303023723dE93b213da4EB53bE890e747C63
    "0xc39cbef1": "changeName(uint256 tokenId, string newName)", // 0xC2C747E0F7004F9E8817Db2ca4997657a7746928
  };
  if (!results.info && txData.tx.data.substring(0, 10) in GENERALCONTRACTMAINTENANCESIGS) {
    results.info = "Call " + GENERALCONTRACTMAINTENANCESIGS[txData.tx.data.substring(0, 10)];
    results.ethPaid = msgValue;
  }

  return results;
}
