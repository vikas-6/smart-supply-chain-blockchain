module.exports = {
  contracts_build_directory: './client/src/artifacts',
  
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network
    },
  },

  compilers: {
    solc: {
      version: "0.5.16"
    }
  },

  db: {
    enabled: false
  }
};
