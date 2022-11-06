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

  if (contract) {
    const interface = new ethers.utils.Interface(contract.abi);
    let decodedData = interface.parseTransaction({ data: tx.data, value: tx.value });
    console.log("decodedData: " + JSON.stringify(decodedData, null, 2));
    if (contract.name == "ETHRegistrarController") {
      // console.log("abi: " + JSON.stringify(contract.abi));
      for (const event of txReceipt.logs) {
        if (event.address == item.to) {
          let log = interface.parseLog(event);
          // console.log("log: " + JSON.stringify(log, null, 2));
          if (log.name == "NameRenewed") {
            const ensName = log.args[0];
            const label = log.args[1];
            const cost = log.args[2];
            const expires = log.args[3];
            // console.log(ensName + " " + label + " " + cost + " " + moment.unix(expires).toString());
            results.summary = "Renewed ENS '" + ensName + " until " + moment.unix(expires).format("YYYY-MM-DD HH:mm:ss") + " for " + ethers.utils.formatEther(cost) + "Ξ";
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
          console.log("HERE log: " + JSON.stringify(log, null, 2));
          if (log.name == "TextChanged") {
            const node = log.args[0];
            const key = log.args[1].hash;
            const value = log.args[2];
            results.summary = "Set ENS node " + node.substring(0, 10) + " key: " + value + " value: " + decodedData.args[2];
          }
        }
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
