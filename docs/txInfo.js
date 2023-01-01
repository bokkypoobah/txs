async function getTxInfo(txHash, item, account, provider) {
  // console.log("getTxInfo: " + txHash + ", currentInfo: " + JSON.stringify(item).substring(0, 60));
  const results = {};
  if (!results.tx) {
    const tx = await provider.getTransaction(txHash);
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
  results.txReceipt = item.txReceipt ? item.txReceipt : await provider.getTransactionReceipt(txHash);
  delete results.txReceipt.logsBloom;
  return results;
}
