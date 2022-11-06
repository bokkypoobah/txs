async function getTxInfo(txHash, item) {

  const contract = item.to && _CUSTOMACCOUNTS[item.to] || null;

  if (contract) {
    if (contract.name == "ETHRegistrarController") {
      console.log("abi: " + JSON.stringify(contract.abi));
    }
  }
  return "Blah";
}
