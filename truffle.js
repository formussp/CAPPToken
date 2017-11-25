// const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const Ganache = require('ganache-core');

module.exports = {
  networks: {
    test: {
      provider() {
        //  ./node_modules/.bin/ganache-cli --host 127.0.0.1 -l 115000000 -d -i 1337
        // const provider = new HDWalletProvider(mnemonic, 'http://localhost:8545/');
        const mnemonic = 'myth like bonus scare over problem client lizard pioneer submit female collect';

        return Ganache.provider({
          seed: mnemonic,
          total_accounts: 10,
          network_id: 1337,
          locked: false,
        });
      },
      network_id: '*',
    },
    ropsten: {
      host: 'localhost',
      port: 8546,
      network_id: 3,
    },
    live: {
      network_id: 1,
      host: 'localhost',
      port: 8547,
    },
  },
  solc: {
    optimizer: {
      enabled: process.env.NODE_ENV === 'production',
      runs: 500
    }
  }
};
