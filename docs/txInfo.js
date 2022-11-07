async function getTxInfo(txHash, item, provider) {
  const results = {
    txHash,
  };
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
  console.log("tx: " + JSON.stringify(tx, null, 2));
  console.log("txReceipt: " + JSON.stringify(txReceipt, null, 2));

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

  // TODO: ERC-20 approve

  // TODO: ERC-20 transfer



  if (!results.summary && contract) {
    const interface = new ethers.utils.Interface(contract.abi);
    let decodedData = interface.parseTransaction({ data: tx.data, value: tx.value });
    console.log("decodedData: " + JSON.stringify(decodedData, null, 2));
    if (contract.name == "ETHRegistrarController") {
      // console.log("abi: " + JSON.stringify(contract.abi));
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