function getTxHashesByBlocks(account, chainId, accounts, accountsInfo) {
  const txHashesByBlocks = {};
  for (const [txHash, tx] of Object.entries(accounts[chainId][account].transactions)) {
    if (!(tx.blockNumber in txHashesByBlocks)) {
      txHashesByBlocks[tx.blockNumber] = {};
    }
    if (!(txHash in txHashesByBlocks[tx.blockNumber])) {
      txHashesByBlocks[tx.blockNumber][txHash] = tx.blockNumber;
    }
  }
  for (const [txHash, traceIds] of Object.entries(accounts[chainId][account].internalTransactions)) {
    for (const [traceId, tx] of Object.entries(traceIds)) {
      if (!(tx.blockNumber in txHashesByBlocks)) {
        txHashesByBlocks[tx.blockNumber] = {};
      }
      if (!(txHash in txHashesByBlocks[tx.blockNumber])) {
        txHashesByBlocks[tx.blockNumber][txHash] = tx.blockNumber;
      }
    }
  }
  for (const [txHash, logIndexes] of Object.entries(accounts[chainId][account].events)) {
    for (const [logIndex, event] of Object.entries(logIndexes)) {
      if (!(event.blockNumber in txHashesByBlocks)) {
        txHashesByBlocks[event.blockNumber] = {};
      }
      if (!(txHash in txHashesByBlocks[event.blockNumber])) {
        txHashesByBlocks[event.blockNumber][txHash] = event.blockNumber;
      }
    }
  }
  // console.log("getTxHashesByBlocks: " + JSON.stringify(txHashesByBlocks, null, 2));
  // let count = 0;
  // for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
  //   for (const [index, txHash] of Object.keys(txHashes).entries()) {
  //     count++;
  //     console.log(count + " " + blockNumber + " " + txHash);
  //   }
  // }
  return txHashesByBlocks;
}
