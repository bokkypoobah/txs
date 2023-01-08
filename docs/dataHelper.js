function getTxHashesByBlocks(account, accounts, accountsInfo, skipBlocks, maxBlocks) {
  const txHashesByBlocks = {};
  for (const [txHash, tx] of Object.entries(accounts[account].transactions)) {
    if (!(tx.blockNumber in txHashesByBlocks)) {
      txHashesByBlocks[tx.blockNumber] = {};
    }
    if (!(txHash in txHashesByBlocks[tx.blockNumber])) {
      txHashesByBlocks[tx.blockNumber][txHash] = tx.blockNumber;
    }
  }
  for (const [txHash, traceIds] of Object.entries(accounts[account].internalTransactions)) {
    for (const [traceId, tx] of Object.entries(traceIds)) {
      if (!(tx.blockNumber in txHashesByBlocks)) {
        txHashesByBlocks[tx.blockNumber] = {};
      }
      if (!(txHash in txHashesByBlocks[tx.blockNumber])) {
        txHashesByBlocks[tx.blockNumber][txHash] = tx.blockNumber;
      }
    }
  }
  for (const [txHash, logIndexes] of Object.entries(accounts[account].events)) {
    for (const [logIndex, event] of Object.entries(logIndexes)) {
      if (!(event.blockNumber in txHashesByBlocks)) {
        txHashesByBlocks[event.blockNumber] = {};
      }
      if (!(txHash in txHashesByBlocks[event.blockNumber])) {
        txHashesByBlocks[event.blockNumber][txHash] = event.blockNumber;
      }
    }
  }
  const results = {};
  let blocksProcessed = 0;
  for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
    if (blocksProcessed >= skipBlocks && blocksProcessed < maxBlocks) {
      if (!(blockNumber in results)) {
        results[blockNumber] = {};
      }
      for (const [index, txHash] of Object.keys(txHashes).entries()) {
        if (!(txHash in results[blockNumber])) {
          results[blockNumber][txHash] = blockNumber;
        }
      }
    }
    blocksProcessed++;
  }
  return results;
}
