pragma solidity >=0.4.22 <0.7.0;

import "openzeppelin-solidity/contracts/token/ERC777/ERC777.sol";


/// @title Basic ERC777 token
contract HolopactToken is ERC777 {
  
  constructor(uint256 initialSupply,
              address[] memory defaultOperators
              )
    ERC777("Holopact", "HOLO", defaultOperators)
    public {
    _mint(msg.sender, msg.sender, initialSupply, "", "");
  }
  
}
