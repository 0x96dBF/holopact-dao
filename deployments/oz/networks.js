module.exports = {
  networks: {
    development: {
      protocol: 'http',
      host: process.env.GANACHE_HOST,
      port: process.env.GANACHE_PORT,
      gas: 5000000,
      gasPrice: 5e9,
      networkId: process.env.GANACHE_NETWORK,
    },
  },
};
