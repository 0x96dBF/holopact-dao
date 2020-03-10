module.exports = {
  networks: {
    development: {
      host: process.env.GANACHE_HOST,
      port: process.env.GANACHE_PORT,
      network_id: process.env.GANACHE_NETWORK,
      accounts: 5,
      defaultEtherBalance: 500
    }
  },

  compilers: {
    solc: {
      version: "0.6.3",
      settings: {
        optimizer: {
          enabled: true
        },
        evmVersion: "petersburg"
      }
    }
  }
}
