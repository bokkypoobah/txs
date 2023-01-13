function getTxHashesByBlocks(account, accounts, accountsInfo, processFilters) {
  const txHashesByBlocks = {};
  const accountList = processFilters.processContracts && processFilters.processContracts.split(/[, \t\n]+/).filter(name => (name.length == 42 && name.substring(0, 2) == '0x')) || null;
  let accountLookup = null;
  if (accountList) {
    accountLookup = {};
    for (const acc of accountList) {
      accountLookup[acc.toLowerCase()] = true;
    }
  }
  for (const [txHash, tx] of Object.entries(accounts[account].transactions)) {
    let include = true;
    if (accountLookup) {
      const contract = tx.to && tx.to && tx.to.toLowerCase() || tx.contractAddress && tx.contractAddress.toLowerCase() || null;
      if (!contract) {
        include = false;
      } else {
        if (!(contract in accountLookup)) {
          include = false;
        }
      }
    }
    if (include) {
      if (!(tx.blockNumber in txHashesByBlocks)) {
        txHashesByBlocks[tx.blockNumber] = {};
      }
      if (!(txHash in txHashesByBlocks[tx.blockNumber])) {
        txHashesByBlocks[tx.blockNumber][txHash] = tx.blockNumber;
      }
    }
  }
  for (const [txHash, traceIds] of Object.entries(accounts[account].internalTransactions)) {
    for (const [traceId, tx] of Object.entries(traceIds)) {
      let include = true;
      if (accountLookup) {
        const contract = tx.from && tx.from && tx.from.toLowerCase() || null;
        if (!contract) {
          include = false;
        } else {
          if (!(contract in accountLookup)) {
            include = false;
          }
        }
      }
      if (include) {
        if (!(tx.blockNumber in txHashesByBlocks)) {
          txHashesByBlocks[tx.blockNumber] = {};
        }
        if (!(txHash in txHashesByBlocks[tx.blockNumber])) {
          txHashesByBlocks[tx.blockNumber][txHash] = tx.blockNumber;
        }
      }
    }
  }
  for (const [txHash, logIndexes] of Object.entries(accounts[account].events)) {
    for (const [logIndex, event] of Object.entries(logIndexes)) {
      let include = true;
      if (accountLookup) {
        const contract = event.contract && event.contract && event.contract.toLowerCase() || null;
        if (!contract) {
          include = false;
        } else {
          if (!(contract in accountLookup)) {
            include = false;
          }
        }
      }
      if (include) {
        if (!(event.blockNumber in txHashesByBlocks)) {
          txHashesByBlocks[event.blockNumber] = {};
        }
        if (!(txHash in txHashesByBlocks[event.blockNumber])) {
          txHashesByBlocks[event.blockNumber][txHash] = event.blockNumber;
        }
      }
    }
  }
  const results = {};
  let blocksProcessed = 0;
  const fb = processFilters.firstBlock && processFilters.firstBlock.toString().length > 0 && parseInt(processFilters.firstBlock) || null;
  const lb = processFilters.lastBlock && processFilters.lastBlock.toString().length > 0 && parseInt(processFilters.lastBlock) || null;
  for (const [blockNumber, txHashes] of Object.entries(txHashesByBlocks)) {
    if ((!fb || parseInt(blockNumber) >= fb) && (!lb || parseInt(blockNumber) <= lb)) {
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
