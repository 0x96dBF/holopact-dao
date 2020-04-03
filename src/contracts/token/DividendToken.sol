pragma solidity >=0.6.0 <0.7.0;

import "./IDividendToken.sol";
import "openzeppelin-solidity/contracts/token/ERC777/ERC777.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";


/**
 * @dev ERC777 token that allows token holders to withdraw dividends paid
 * into the contract in proportion to their holdings at the point the
 * dividend was paid. Changes in total token supply are accounted for.
 * Only the token holder can trigger withdrawal of their funds.
 * Calculations of owed amounts are amortized, so there exist no unbounded
 * functions in terms of work done.
 */
contract DividendToken is ERC777, IDividendToken {
    using SafeMath for uint256;
    using Address for address payable;

    // Used to record the outstanding balance for an address
    struct DividendBalance {
        uint256 balance; // remaining amount owed
        uint256 drawnFrom; // total (adjusted) dividends balance has been calculated from
    }

    mapping (address => DividendBalance) internal dividendBalance_;
    uint256 private adjustedDividends_; // total dividends issued, adjusted for changes in supply
    uint256 private baseTotal_; // initial token supply used to adjust recorded dividend amount
    uint256 internal minimum_; // the minimum allowable dividend payment

    constructor(string memory name,
                string memory symbol,
                address[] memory defaultOperators,
                uint256 initialSupply,
                uint256 minimumDeposit)
        ERC777(name, symbol, defaultOperators)
        public {
        baseTotal_ = initialSupply;
        minimum_ = minimumDeposit;
        _mint(msg.sender, initialSupply, "", "");
    }

    /**
     * @dev Pays a dividend into the contract. Value must be above minimum_.
     */
    function depositDividend() public payable override returns (bool) {
        require(msg.value >= minimum_, "DividendToken: deposit below minimum");
        _depositDividend(msg.value);
        emit DividendDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Withdraws owed dividend payments to the calling address
     * @return wei paid
     */
    function withdrawBalance() public override returns (uint256) {
        uint amount = _withdrawFor(msg.sender);
        emit BalanceWithdrawn(msg.sender, amount);
        return amount;
    }

    /**
     * @dev Gets the total amount withdrawable by the given address
     */
    function outstandingBalanceFor(address _account) public view override returns (uint256) {
        if (adjustedDividends_ == 0) return 0;
        uint additional = adjustedDividends_
            .sub(dividendBalance_[_account].drawnFrom)
            .mul(balanceOf(_account))
            .div(baseTotal_);
        return dividendBalance_[_account].balance.add(additional);
    }

    /**
     * @dev Used to calculate dividends - value returned here must
     * equal the total amount of tokens against which dividends can be
     * claimed
     */
    function _distributableSupply() internal view returns (uint256) {
        return totalSupply();
    }

    /**
     * @dev Adds an incoming dividend payment to cumulative
     * total to facilitate withdrawal calculation.
     * adjustedDividends_ holds the cumulative total of payments,
     * adjusted for change in total supply against a baseTotal_.
     */
    function _depositDividend(uint256 _value) internal {
        require(_distributableSupply() > 0, "DividendToken: no tokens to distribute to");

        if (baseTotal_ == 0) {
            baseTotal_ = _distributableSupply();
        }

        if (_distributableSupply() == baseTotal_)
            adjustedDividends_ = adjustedDividends_.add(_value);
        else {
            uint adjustedValue = _value.mul(baseTotal_).div(_distributableSupply());
            adjustedDividends_ = adjustedDividends_.add(adjustedValue);
        }
    }

    /**
     * @dev Withdraw outstanding balance for given _address
     */
    function _withdrawFor(address payable _address) internal returns (uint256) {
        _updateBalance(_address);
        uint balance = dividendBalance_[_address].balance;
        if (balance > 0) {
            dividendBalance_[_address].balance = 0; // avoid potential reentrancy
            _address.sendValue(balance);            // pay after balance is 0'd
        }
        return balance;
    }

    /**
     * @dev Updates the record of the outstanding dividends for a given
     * address. Takes the total (adjusted) dividends paid since last update
     * and divides by the balance of the address. Must be called
     * before balance is adjusted.
     */
    function _updateBalance(address _for) internal {
        if (dividendBalance_[_for].drawnFrom < adjustedDividends_) {
            uint additional = adjustedDividends_
                .sub(dividendBalance_[_for].drawnFrom)
                .mul(balanceOf(_for))
                .div(baseTotal_);
            dividendBalance_[_for].balance = dividendBalance_[_for].balance.add(additional);
            dividendBalance_[_for].drawnFrom = adjustedDividends_;
        }
    }

    /**
     * @dev Ensure that amount owed to token burner is update before tokens
     * are burned
     */
    function _burn(
        address _from,
        uint256 _amount,
        bytes memory _data,
        bytes memory _operatorData
    )
        internal override
    {
        _updateBalance(_from);
        super._burn(_from, _amount, _data, _operatorData);
    }

    /**
     * @dev Ensure that owed amounts are brought up-to-date before
     * tokens are moved
     */
    function _beforeTokenTransfer(address, address _from, address _to, uint256)
        internal override
    {
        _updateBalance(_from);
        _updateBalance(_to);
    }

}
