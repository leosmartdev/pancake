const pair_abi = require("./contract_attributes/pair.json")
const erc20_abi = require("./contract_attributes/erc20.json")

const factory_abi = require("./contract_attributes/factory.json")
const router_abi = require("./contract_attributes/router.json")
var helperFunctions = require('./helper-functions')
const web3_HTTPS = helperFunctions.web3_HTTPS;
const web3_WSS = helperFunctions.web3_WSS;
const Tx = require("ethereumjs-transaction");
let txCount;
var BN = web3_HTTPS.utils.BN;

require("dotenv").config();
var privKey = Buffer.from(process.env.WALLET, "hex");// Genesis private key
const { address } = web3_HTTPS.eth.accounts.privateKeyToAccount(process.env.WALLET);

const routerContract = new web3_HTTPS.eth.Contract(
  router_abi,
  process.env.ROUTER
);
const factoryContract = new web3_HTTPS.eth.Contract(
  factory_abi,
  process.env.FACTORY
);

const run = async () => {
  let gasPrice = web3_HTTPS.utils.toHex(web3_HTTPS.utils.toWei(process.env.GAS_PRICE, 'Gwei'));
  const pair_address = await factoryContract.methods.getPair(process.env.BASETOKEN, process.env.TARGETTOKEN).call();
  const pairContract = new web3_HTTPS.eth.Contract(
    pair_abi,
    pair_address
  );
  const baseTokenContract = new web3_HTTPS.eth.Contract(
    erc20_abi,
    process.env.BASETOKEN
  );
  const targetTokenContract = new web3_HTTPS.eth.Contract(
    erc20_abi,
    process.env.TARGETTOKEN
  );
  const baseTokenDecimals = await baseTokenContract.methods.decimals().call();
  const targetTokenDecimals = await targetTokenContract.methods.decimals().call();
  txCount = await web3_HTTPS.eth.getTransactionCount(address);
  //approve
  let txObject = {
    chainId: web3_HTTPS.utils.toHex(process.env.CHAIN_ID),
    nonce: web3_HTTPS.utils.toHex(txCount),
    gasLimit: web3_HTTPS.utils.toHex(10000), // Raise the gas limit to a much higher amount
    gasPrice: gasPrice,
    to: process.env.BASETOKEN,
    data: baseTokenContract.methods.approve(process.env.ROUTER, "0xfffffffffffffffffffffffffffffffe").encodeABI()
  };
  let tx = new Tx(txObject);
  tx.sign(privKey);
  await web3_HTTPS.eth.sendSignedTransaction("0x" + tx.serialize().toString("hex"));
  txCount++;
  txObject = {
    chainId: web3_HTTPS.utils.toHex(process.env.CHAIN_ID),
    nonce: web3_HTTPS.utils.toHex(txCount),
    gasLimit: web3_HTTPS.utils.toHex(10000), // Raise the gas limit to a much higher amount
    gasPrice: gasPrice,
    to: process.env.TARGETTOKEN,
    data: targetTokenContract.methods.approve(process.env.ROUTER, "0xfffffffffffffffffffffffffffffffe").encodeABI()
  };
  tx = new Tx(txObject);
  tx.sign(privKey);
  await web3_HTTPS.eth.sendSignedTransaction("0x" + tx.serialize().toString("hex"));

  setInterval(async () => {
    try {
      let [RI, RO] = await pairContract.methods.getReserves().call();
      const price = ((new BN(RI)).div(new BN(RO)).div(new BN(Math.pow(10, baseTokenDecimals))).mul(new BN(Math.pow(10, targetTokenDecimals)))).toNumber();
      //
      //calculation


      //buy or sell
      txCount++;
      txObject = {
        chainId: web3_HTTPS.utils.toHex(process.env.CHAIN_ID),
        nonce: web3_HTTPS.utils.toHex(txCount),
        gasLimit: web3_HTTPS.utils.toHex(10000), // Raise the gas limit to a much higher amount
        gasPrice: gasPrice,
        to: process.env.ROUTER,
        data: routerContract.methods.swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn, amountOutMin, [process.env.BASETOKEN, process.env.TARGETTOKEN],
          address).encodeABI()
      };
      tx = new Tx(txObject);
      tx.sign(privKey);
      await web3_HTTPS.eth.sendSignedTransaction("0x" + tx.serialize().toString("hex"));
    } catch (err) {
      console.log(err);
    }
  }, 10000);

};


