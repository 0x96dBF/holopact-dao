pragma solidity >=0.4.22 <0.7.0;

import "./DividendToken.sol";


/// @title Basic ERC777 token
contract HolopactToken is DividendToken {
  
  constructor(uint256 initialSupply)
    DividendToken("Holopact", "HOLO", new address[](0), initialSupply * (10 ** 18), 1)
    public {}

}
