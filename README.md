
## Overview
ARToken with ERC20 functionality.

www.artoken.io
www.cappasity.com

### contracts/TokenAllocation.sol
A crowdsale contract that:
1. Allows the off-chain backend to mint tokens;
2. Assigns bonuses sliding on sales;
3. Sends 18% of total token supply to a vested wallet (24 months vesting with 30 days cliff),
12% to a given address for backend allocation to early contributors.
