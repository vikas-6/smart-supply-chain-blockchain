const SmartSupplyChain = artifacts.require("SmartSupplyChain");
const SmartTrustScore = artifacts.require("SmartTrustScore");

module.exports = function(deployer) {
  deployer.deploy(SmartSupplyChain);
  deployer.deploy(SmartTrustScore);
};
