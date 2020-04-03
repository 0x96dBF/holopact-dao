pragma solidity >=0.6.0 <0.7.0;

import "../token/DividendToken.sol";


/**
 */
contract DividendTokenMock is DividendToken {

    constructor(uint256 _minimumDeposit)
        DividendToken("DividendToken",
                      "DIV",
                      new address[](0),
                      0,
                      _minimumDeposit)
        public {}

    function mintInternal(address _to, uint256 _amount) public {
        _mint(_to, _amount, "", "");
    }

    function burnInternal(address _from, uint256 _amount) public {
        _burn(_from, _amount, "", "");
    }
    
}
