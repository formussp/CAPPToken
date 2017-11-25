const TokenAllocation = artifacts.require('./TokenAllocation.sol');

/*
var icoManager = "0x0";     // Public key for the backend script that mints tokens
var foundersWallet = "0x0"; // Public key of Kosta's wallet that will receive tokens after vesting
var partnersWallet = "0x0"; // Public key of the wallet that allocates early contributors' bonus
var totalWeiGathered = 0;   // Total sum of all the money gathered throughout the crowdsale
*/

// Test data corresponding to ../testrpc.sh, see the keys there
// var icoManager = "0x7fb504439b8a99cf1e31dfd0490fd19a7bb502d0";     // Public key for the manager that launches phases and pauses
// var icoBackend = "0x7fb504439b8a99cf1e31dfd0490fd19a7bb502d0";     // Public key for the backend script that mints tokens
// var foundersWallet = "0xb8d3051d9a97247e592cbc49a1dc14cfa2c0aee0"; // Public key of Kosta's wallet that will receive tokens after vesting
// var partnersWallet = "0xb8d3051d9a97247e592cbc49a1dc14cfa2c0aee0"; // Public key of the wallet that allocates early contributors' bonus
// var emergencyManager = "0xb8d3051d9a97247e592cbc49a1dc14cfa2c0aee0"; // Public key of the wallet that can perform emergency functions

const info = [
  'icoManager: %s',
  'icoBackend: %s',
  'foundersWallet: %s',
  'partnersWallet: %s',
  'emergencyManager: %s\n',
].join('\n');

module.exports = function(deployer, network, _accounts) {
  const accounts = _accounts.slice(0, 5);

  console.info('\nAccounts:');
  console.info(info, ...accounts);

  if (network === 'live') {
    throw new Error('ensure before deploying');
  }

  deployer.deploy(TokenAllocation, ...accounts);
};
