function parseTx(chainId, account, accounts, txData) {
  console.log("parseTx: " + JSON.stringify(account));

  const results = {};
  // const events = [];
  const gasUsed = ethers.BigNumber.from(txData.txReceipt.gasUsed);
  // const txFee = gasUsed.mul(txData.txReceipt.effectiveGasPrice);
  // events.push({ from: txData.tx.from, to: null, operator: null, type: "txfee", asset: "eth", tokenId: null, value: txFee });
  //
  // EOA to EOA ETH transfer
  if (gasUsed == 21000) {
    if (txData.tx.from == account && txData.tx.to == account) {
      console.log("  EOA to EOA - Self Transfer ");
    } else if (txData.tx.from == account) {
      console.log("  EOA to EOA - Sent ");
    } else if (txData.tx.to == account) {
      console.log("  EOA to EOA - Received");
    }


  //   events.push({ from: txData.tx.from, to: txData.tx.to, operator: null, type: "ethtransfer", asset: "eth", tokenId: null, value: txData.tx.value });
  //   if (primaryAccount) {
  //     if (primaryAccount == txData.tx.from) {
  //       if (primaryAccount == txData.tx.to) {
  //         results.info = "Self transfer (cancellation) " + ethers.utils.formatEther(txData.tx.value) + "Ξ";
  //       } else {
  //         results.info = "Sent to " + txData.tx.to.substring(0, 16) + " " + ethers.utils.formatEther(txData.tx.value) + "Ξ";
  //       }
  //     } else {
  //       results.info = "Received from " + txData.tx.to.substring(0, 16) + " " + ethers.utils.formatEther(txData.tx.value) + "Ξ";
  //     }
  //   } else {
  //     results.info = "Transferred " + ethers.utils.formatEther(txData.tx.value) + "Ξ"; // + tx.to;
  //   }
  //   // console.log("events: " + JSON.stringify(events, null, 2));
  }



}
