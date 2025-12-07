// client/src/web3Provider.js
import Web3 from 'web3';

let web3Instance = null;

export const getWeb3 = () => {
  if (web3Instance) return web3Instance;
  // Try MetaMask provider
  if (window.ethereum) {
    web3Instance = new Web3(window.ethereum);
    try {
      // Request account access if needed
      window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      console.error('User denied account access', error);
    }
  } else if (window.web3) {
    // Legacy dapp browsers
    web3Instance = new Web3(window.web3.currentProvider);
  } else {
    // Fallback to local Ganache RPC
    const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
    web3Instance = new Web3(provider);
  }
  return web3Instance;
};
