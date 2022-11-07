async function getAccountInfo(address, provider) {
  // console.log("getAccountInfo(" + address + ")");
  const results = {};

  let account = null;
  try {
    account = ethers.utils.getAddress(address);
    // console.log("checksummed account: " + account);
  } catch (e) {
    console.log(e.toString());
  }

  if (account) {
    results.account = account;
    if (account in _CUSTOMACCOUNTS) {
      results.mask = _CUSTOMACCOUNTS[account].mask;
      results.symbol = _CUSTOMACCOUNTS[account].symbol;
      results.name = _CUSTOMACCOUNTS[account].name;
      results.decimals = _CUSTOMACCOUNTS[account].decimals;
    } else {
      const erc721Helper = new ethers.Contract(ERC721HELPERADDRESS, ERC721HELPERABI, provider); // network.erc721HelperAddress
      try {
        const tokenInfos = await erc721Helper.tokenInfo([account], { gasLimit: 1000000 });
        for (let i = 0; i < tokenInfos[0].length; i++) {
          results.mask = tokenInfos[0][i].toNumber();
          results.symbol = tokenInfos[1][i];
          results.name = tokenInfos[2][i];
        }
      } catch (e) {
        console.log("getAccountInfo ERROR - account: " + account + ", message: " + e.message);
        results.mask = 0;
        results.symbol = null;
        results.name = null;
      }
      results.decimals = null;
      if ((results.mask & MASK_ISERC20) == MASK_ISERC20) {
        const erc20 = new ethers.Contract(account, ERC20ABI, provider);
        try {
          results.decimals = await erc20.decimals();
        } catch (e) {
          console.log("getAccountInfo ERROR - decimals - account: " + account + ", message: " + e.message);
        }
      }
      if ((results.mask & MASK_ISERC721) == MASK_ISERC721) {
        let url = "https://api.reservoir.tools/collections/v5?contract=" + account;
        // console.log("url: " + url);
        const data = await fetch(url)
          .then(handleErrors)
          .then(response => response.json())
          .catch(function(error) {
             console.log("ERROR - updateCollection: " + error);
             // state.sync.error = true;
             return [];
          });
        if (data && data.collections && data.collections.length == 1) {
          // console.log("data: " + JSON.stringify(data, null, 2));
          const collectionInfo = data.collections[0];
          results.collection = {
            name: collectionInfo.name,
            slug: collectionInfo.slug,
            image: collectionInfo.image,
            tokenCount: parseInt(collectionInfo.tokenCount),
            onSaleCount: parseInt(collectionInfo.onSaleCount),
            volume: collectionInfo.volume,
            openseaVerificationStatus: collectionInfo.openseaVerificationStatus,
          };
        }
      }
    }
    if ((results.mask & MASK_ISEOA) == MASK_ISEOA) {
      results.type = "eoa";
    } else if ((results.mask & MASK_ISERC721) == MASK_ISERC721) {
      results.type = "erc721";
    } else if ((results.mask & MASK_ISERC20) == MASK_ISERC20) {
      results.type = "erc20";
    } else if ((results.mask & MASK_ISCONTRACT) == MASK_ISCONTRACT) {
      results.type = "contract";
    } else {
      result.type = null;
    }
    const ethBalance = await provider.getBalance(account);
    const weth = new ethers.Contract(WETHADDRESS, WETHABI, provider); // network.wethAddress
    const wethBalance = await weth.balanceOf(account);
    results.balances = {
      "eth": ethBalance,
      "weth": wethBalance,
    };
  }
  // console.log("results: " + JSON.stringify(results, null, 2));
  return results;
}
