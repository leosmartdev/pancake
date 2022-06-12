const web3 = require("web3");
require("dotenv").config();
const Web3_WSS = new web3(process.env.WS_ENDPOINT);
const Web3_HTTPS = new web3(process.env.HTTPS_ENDPOINT);

module.exports = {
  web3_HTTPS: Web3_HTTPS,
  web3_WSS:Web3_WSS,
}