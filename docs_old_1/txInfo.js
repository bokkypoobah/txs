function parseTxOld(item, primaryAccount) {
  const results = {};
  const events = [];
  const gasUsed = ethers.BigNumber.from(item.txReceipt.gasUsed);
  const txFee = gasUsed.mul(item.txReceipt.effectiveGasPrice);
  events.push({ from: item.tx.from, to: null, operator: null, type: "txfee", asset: "eth", tokenId: null, value: txFee });

  // EOA to EOA ETH transfer
  if (gasUsed == 21000) {
    events.push({ from: item.tx.from, to: item.tx.to, operator: null, type: "ethtransfer", asset: "eth", tokenId: null, value: item.tx.value });
    if (primaryAccount) {
      if (primaryAccount == item.tx.from) {
        if (primaryAccount == item.tx.to) {
          results.info = "Self transfer (cancellation) " + ethers.utils.formatEther(item.tx.value) + "Ξ";
        } else {
          results.info = "Sent to " + item.tx.to.substring(0, 16) + " " + ethers.utils.formatEther(item.tx.value) + "Ξ";
        }
      } else {
        results.info = "Received from " + item.tx.to.substring(0, 16) + " " + ethers.utils.formatEther(item.tx.value) + "Ξ";
      }
    } else {
      results.info = "Transferred " + ethers.utils.formatEther(item.tx.value) + "Ξ"; // + tx.to;
    }
    // console.log("events: " + JSON.stringify(events, null, 2));
  }

  if (!results.info && item.tx.data.substring(0, 10) == "0xa22cb465") {
    results.info = "setApprovalForAll";
    const interface = new ethers.utils.Interface(ERC721ABI);
    // let decodedData = interface.parseTransaction({ data: item.tx.data, value: item.tx.value });
    // for (const event of item.txReceipt.logs) {
    //   let log = interface.parseLog(event);
    //   if (log.name == "ApprovalForAll") {
    //     const [tokenOwner, operator, approved] = [log.args[0], log.args[1], log.args[2]];
    //     events.push({ from: item.tx.from, to: null, operator: operator, type: "erc721approval", asset: log.address, tokenId: null, value: approved ? 1 : 0 });
    //     if (approved) {
    //       results.info = "Approved transfer of " + item.tx.to.substring(0, 16) + " to " + operator.substring(0, 16);
    //     } else {
    //       results.info = "Revoked transfer approval of " + item.tx.to.substring(0, 16) + " from " + operator.substring(0, 16);
    //     }
    //   }
    // }
    // console.log("setApprovalForAll: " + JSON.stringify(events, null, 2));
  }

  // ERC-721 safeTransferFrom(address from, address to, uint256 tokenId)
  if (!results.info && item.tx.data.substring(0, 10) == "0x42842e0e") {
    // const interface = new ethers.utils.Interface(NEWERC721ABI);
    // let decodedData = interface.parseTransaction({ data: item.tx.data, value: item.tx.value });
    for (const event of item.txReceipt.logs) {
      if (event.address == item.tx.to && event.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
        const from = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
        const to = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
        let tokenId = event.topics.length == 3 ? ethers.BigNumber.from(event.data) : ethers.BigNumber.from(event.topics[3]);
        events.push({ from: from, to: to, operator: null, type: "erc721transfer", asset: event.address, tokenId: tokenId, value: null });
        if (tokenId.length > 30) {
          results.info = "Transferred ERC-721 " + item.tx.to.substring(0, 16) + ":" + tokenId.substring(0, 10) + "... from " + from.substring(0, 16) + " to " + to.substring(0, 16);
        } else {
          results.info = "Transferred ERC-721 " + item.tx.to.substring(0, 16) + ":" + tokenId + "... from " + from.substring(0, 16) + " to " + to.substring(0, 16);
        }
      }
    }
    // console.log("safeTransferFrom: " + JSON.stringify(events, null, 2));
  }

  // ERC-20 approve(address guy, uint256 wad)
  if (!results.info && item.tx.data.substring(0, 10) == "0x095ea7b3") {
    // const interface = new ethers.utils.Interface(ERC20ABI);
    // let decodedData = interface.parseTransaction({ data: item.tx.data, value: item.tx.value });
    for (const event of item.txReceipt.logs) {
      if (event.address == item.tx.to && event.topics[0] == "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925") {
        const tokenOwner = ethers.utils.getAddress('0x' + event.topics[1].substring(26));
        const operator = ethers.utils.getAddress('0x' + event.topics[2].substring(26));
        let tokens = event.topics.length == 3 ? ethers.BigNumber.from(event.data) : ethers.BigNumber.from(event.topics[3]);
        if (tokens > 1_000_000_100) {
          results.info = "Approved for " + operator.substring(0, 16) + " to transfer infinite " + event.address.substring(0, 16);
        } else {
          results.info = "Approved for " + operator.substring(0, 16) + " to transfer " + event.address.substring(0, 16) + ":" + tokens;
        }
      }
    }
  }

  results.events = events;
  return results;
}

async function getTxInfo(txHash, item, provider, signatures) {
  // console.log("getTxInfo: " + txHash + ", currentInfo: " + JSON.stringify(item).substring(0, 60));
  const results = {};
  const newFunctionSigs = {};
  const newEventSigs = {};
  if (!results.tx) {
    console.log("getTxInfo - getTransaction: " + txHash); // + " " + JSON.stringify(signatures));
    const tx = await provider.getTransaction(txHash);
    // if (tx.to != null && tx.data.length > 10) {
    //   console.log("tx.data: " + tx.data);
    //   const signature = tx.data.substring(0, 10);
    //   if (!(signature in signatures.functionSignatures)) {
    //     let url = "https://www.4byte.directory/api/v1/signatures/?hex_signature=" + signature;
    //     console.log(url);
    //     const data = await fetch(url)
    //       .then(response => response.json())
    //       .catch(function(e) {
    //         console.log("error: " + e);
    //       });
    //     // console.log(JSON.stringify(data, null, 2));
    //     if (data.count > 0) {
    //       const signatureList = data.results.map(e => e.text_signature);
    //       newFunctionSigs[signature] = signatureList;
    //       console.log("signatureList: " + JSON.stringify(signatureList, null, 2));
    //     }
    //   }
    // }
    results.tx = {
      hash: tx.hash,
      type: tx.type,
      blockHash: tx.blockHash,
      blockNumber: tx.blockNumber,
      transactionIndex: tx.transactionIndex,
      from: tx.from,
      gasPrice: tx.gasPrice,
      gasLimit: tx.gasLimit,
      to: tx.to,
      value: tx.value,
      nonce: tx.nonce,
      data: tx.data,
      r: tx.r,
      s: tx.s,
      v: tx.v,
      chainId: tx.chainId,
    };
  }
  if (!results.timestamp) {
    // console.log("getTxInfo - getBlock: " + results.tx.blockNumber);
    const block = await provider.getBlock(results.tx.blockNumber);
    results.timestamp = block.timestamp;
  }
  // console.log("getTxInfo - getTransactionReceipt: " + txHash);
  results.txReceipt = item.txReceipt ? item.txReceipt : await provider.getTransactionReceipt(txHash);
  delete results.txReceipt.logsBloom;
  // console.log("getTxInfo - getBalance: " + results.tx.from + " @ " + results.txReceipt.blockNumber);
  // try {
  //   results.ethBalance = await provider.getBalance(results.tx.from, results.txReceipt.blockNumber);
  // } catch (e) {
  //   console.log("getTxInfo - getBalance error: " + results.tx.from + " @ " + results.txReceipt.blockNumber);
    results.ethBalance = null;
  // }
  // console.log("getTxInfo - getBalance: " + results.tx.from + " @ " + results.txReceipt.blockNumber - 1);
  // try {
  //   results.ethBalancePreviousBlock = await provider.getBalance(results.tx.from, results.txReceipt.blockNumber - 1);
  // } catch (e) {
  //   console.log("getTxInfo - getBalance -1 error: " + results.tx.from + " @ " + results.txReceipt.blockNumber - 1);
    results.ethBalancePreviousBlock = null;
  // }
  // console.log("getTxInfo - completed");
  results.gasUsed = ethers.BigNumber.from(results.txReceipt.gasUsed);
  results.effectiveGasPrice = ethers.BigNumber.from(results.txReceipt.effectiveGasPrice);
  results.txFee = results.gasUsed.mul(results.effectiveGasPrice);
  // console.log("results.tx: " + JSON.stringify(results.tx, null, 2));
  // console.log("results: " + JSON.stringify(results, null, 2));

  return [results, { functionSignatures: newFunctionSigs, eventSignatures: newEventSigs }];

  // TODO: Delete below
  const contract = item.to && _CUSTOMACCOUNTS[item.to] || null;

  if (item.importedData && item.importedData.tx) {
    console.log("item.importedData.tx: " + JSON.stringify(item.importedData.tx));
  }
  const tx = item.importedData && item.importedData.tx || await provider.getTransaction(txHash);
  const txReceipt = item.importedData && item.importedData.txReceipt || await provider.getTransactionReceipt(txHash);
  // const block = await provider.getBlock(txReceipt.blockNumber);
  const ethBalance = await provider.getBalance(tx.from, txReceipt.blockNumber);
  const ethBalancePreviousBlock = await provider.getBalance(tx.from, txReceipt.blockNumber - 1);
  results.tx = tx;
  results.txReceipt = txReceipt;
  results.ethBalance = ethBalance;
  results.ethBalancePreviousBlock = ethBalancePreviousBlock;
  // console.log("tx: " + JSON.stringify(tx, null, 2));
  // console.log("txReceipt: " + JSON.stringify(txReceipt, null, 2));
  const gasUsed = ethers.BigNumber.from(txReceipt.gasUsed);
  // console.log("    gasUsed: " + gasUsed.toNumber());
  const effectiveGasPrice = ethers.BigNumber.from(txReceipt.effectiveGasPrice);
  // console.log("    effectiveGasPrice: " + ethers.utils.formatUnits(effectiveGasPrice, "gwei") + " gwei");
  const txFee = gasUsed.mul(effectiveGasPrice);
  console.log("    txFee: " + ethers.utils.formatEther(txFee) + " ETH");

  // ETH transfers
  if (txReceipt.gasUsed == 21000) {
    console.log("ETH transfer");
    results.summary = "Transferred " + ethers.utils.formatEther(tx.value) + "Ξ"; // + tx.to;
  }

  // ERC-721 setApprovalForAll
  if (!results.summary && tx.data.substring(0, 10) == "0xa22cb465") {
    console.log("ERC-721 setApprovalForAll");
    const interface = new ethers.utils.Interface(ERC721ABI);
    let decodedData = interface.parseTransaction({ data: tx.data, value: tx.value });
    for (const event of txReceipt.logs) {
      let log = interface.parseLog(event);
      if (log.name == "ApprovalForAll") {
        const tokenOwner = log.args[0]
        const operator = log.args[1];
        const approved = log.args[2];
        if (approved) {
          results.summary = "Approved transfer of " + tx.to.substring(0, 16) + " to " + operator.substring(0, 16);
        } else {
          results.summary = "Revoked transfer approval of " + tx.to.substring(0, 16) + " from " + operator.substring(0, 16);
        }
      }
    }
  }

  // ERC-721 safeTransferFrom(address from, address to, uint256 tokenId)
  if (!results.summary && tx.data.substring(0, 10) == "0x42842e0e") {
    console.log("ERC-721 safeTransferFrom");
    const interface = new ethers.utils.Interface(ERC721ABI);
    let decodedData = interface.parseTransaction({ data: tx.data, value: tx.value });
    console.log("decodedData: " + JSON.stringify(decodedData, null, 2));
    for (const event of txReceipt.logs) {
      let log = interface.parseLog(event);
      console.log("log: " + JSON.stringify(log, null, 2));
      // Transfer (index_topic_1 address from, index_topic_2 address to, index_topic_3 uint256 tokenId)
      if (log.name == "Transfer") {
        const from = log.args[0]
        const to = log.args[1];
        const tokenId = log.args[2];
        results.summary = "Transferred ERC-721 " + tx.to.substring(0, 16) + ":" + tokenId + " from " + from.substring(0, 16) + " to " + to.substring(0, 16);
      }
    }
  }

  // TODO: ERC-721 transfer

  // TODO: ERC-20 approve(address guy, uint256 wad)
  if (!results.summary && tx.data.substring(0, 10) == "0x095ea7b3") {
    console.log("ERC-20 approve");
    const interface = new ethers.utils.Interface(ERC20ABI);
    let decodedData = interface.parseTransaction({ data: tx.data, value: tx.value });
    for (const event of txReceipt.logs) {
      let log = interface.parseLog(event);
      console.log(JSON.stringify(log, null, 2));
      // Approval (index_topic_1 address src, index_topic_2 address guy, uint256 wad)View Source
      if (log.name == "Approval") {
        const src = log.args[0];
        const guy = log.args[1];
        const wad = log.args[2];
        if (ethers.utils.formatEther(wad) > 10000000) {
          results.summary = "Approved for " + guy + " to transfer a big amount";
        } else {
          results.summary = "Approved for " + guy + " to transfer " + ethers.utils.formatEther(wad);
        }
      }
    }
  }
  // TODO: ERC-20 transfer


  if (!results.summary && contract && contract.abi) {
    const interface = new ethers.utils.Interface(contract.abi);
    let decodedData = interface.parseTransaction({ data: tx.data, value: tx.value });
    console.log("decodedData: " + JSON.stringify(decodedData, null, 2));
    if (contract.name == "WETH9") {
      console.log("WETH9");
      for (const event of txReceipt.logs) {
        if (event.address == item.to) {
          let log = interface.parseLog(event);
          // console.log("log: " + JSON.stringify(log, null, 2));
          // Withdrawal (index_topic_1 address src, uint256 wad)
          if (log.name == "Withdrawal") {
            const src = log.args[0];
            const wad = log.args[1];
            results.summary = "Unwrapped " + ethers.utils.formatEther(wad) + "Ξ";
            // Deposit (index_topic_1 address dst, uint256 wad)
          } else if (log.name == "Deposit") {
            const src = log.args[0];
            const wad = log.args[1];
            results.summary = "Wrapped " + ethers.utils.formatEther(wad) + "Ξ";
          }
        }
      }
    } else if (contract.name == "ETHRegistrarController") {
      // console.log("abi: " + JSON.stringify(contract.abi));
      if (decodedData.name == "commit") {
        console.log("commit");
        const commitment = decodedData.args[0];
        results.summary = "Commit to register ENS '" + commitment + "'";
      } else {
        for (const event of txReceipt.logs) {
          if (event.address == item.to) {
            let log = interface.parseLog(event);
            console.log("log: " + JSON.stringify(log, null, 2));
            if (log.name == "NameRenewed") {
              const ensName = log.args[0];
              const label = log.args[1];
              const cost = log.args[2];
              const expires = log.args[3];
              // console.log(ensName + " " + label + " " + cost + " " + moment.unix(expires).toString());
              results.summary = "Renewed ENS '" + ensName + " until " + moment.unix(expires).format("YYYY-MM-DD HH:mm:ss") + " for " + ethers.utils.formatEther(cost) + "Ξ";
            }
            // NameRegistered (string name, index_topic_1 bytes32 label, index_topic_2 address owner, uint256 cost, uint256 expires)
            if (log.name == "NameRegistered") {
              const ensName = log.args[0];
              const label = log.args[1];
              const owner = log.args[2];
              const cost = log.args[3];
              const expires = log.args[4];
              console.log(ensName + " " + owner);
              results.summary = "Registered ENS '" + ensName + "' until " + moment.unix(expires).format("YYYY-MM-DD HH:mm:ss") + " for " + ethers.utils.formatEther(cost) + "Ξ";
            }
            // const registration = data.events.filter(e => e.name == "NameRegistered").flat();
            // const costRecord = registration && registration.length > 0 && registration[0].args.filter(e => e.name == "cost").flat() || null;
            // const cost = costRecord && costRecord[0].data || null;
            // const refund = cost && ethers.BigNumber.from(txItem.data.tx.value).sub(cost) || null;
            // data.refund = refund;

          }
        }
      }
    } else if (contract.name == "PublicResolver") {
      // console.log("abi: " + JSON.stringify(contract.abi));
      for (const event of txReceipt.logs) {
        if (event.address == item.to) {
          let log = interface.parseLog(event);
          // console.log("log: " + JSON.stringify(log, null, 2));
          if (log.name == "TextChanged") {
            const node = log.args[0];
            const key = log.args[1].hash;
            const value = log.args[2];
            results.summary = "Set ENS node " + node.substring(0, 10) + " key: " + value + " value: " + decodedData.args[2];
          }
        }
      }
    } else if (contract.name == "OpenSeaTransferHelper") {
      console.log("OpenSeaTransferHelper");
      const interface = new ethers.utils.Interface(ERC721ABI);
      const transfers = [];
      for (const event of txReceipt.logs) {
        console.log("event: " + JSON.stringify(event));
        if (event.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
          // let log = interface.parseLog(event);
          // console.log("HERE log: " + JSON.stringify(log, null, 2));
          const address = event.address;
          const from = ethers.utils.getAddress("0x" + event.topics[1].substring(26));
          const to = ethers.utils.getAddress("0x" + event.topics[2].substring(26));
          const tokenId = event.data;
          console.log("address: " + address);
          console.log("from: " + from);
          console.log("to: " + to);
          console.log("tokenId: " + tokenId);
          transfers.push({ address, from, to, tokenId });
        }
        console.log("transfers: " + JSON.stringify(transfers));
        results.summary = "Transferred " + JSON.stringify(transfers);
      }
    } else if (contract.name == "Seaport") {
      // console.log("abi: " + JSON.stringify(contract.abi));
      for (const event of txReceipt.logs) {
        if (event.address == item.to) {
          let log = interface.parseLog(event);
          // console.log("log: " + JSON.stringify(log, null, 2));
        }
      }
    }
  }
  return results;
}
