// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title PaymentContract
 * @dev A simple contract to demonstrate receiving Ether payments.
 * For a real-world application, this contract would be much more complex,
 * including features like associating payments with specific appointments,
 * handling refunds, and managing payouts to doctors.
 */
contract PaymentContract {
    address public owner; // The address that deployed the contract

    // Event emitted when Ether is received
    event PaymentReceived(address indexed payer, uint256 amount);

    // Constructor: sets the deployer as the owner
    constructor() {
        owner = msg.sender;
    }

    // receive() external payable: This special function is executed when Ether is sent
    // to the contract without any specific function call (e.g., a plain Ether transfer).
    // The `payable` keyword is crucial, allowing the function to receive Ether.
    receive() external payable {
        // Emit an event to log the payment details on the blockchain
        emit PaymentReceived(msg.sender, msg.value);
    }

    // withdraw() public onlyOwner: Allows the owner to withdraw all Ether from the contract.
    // The `onlyOwner` modifier ensures only the contract deployer can call this.
    function withdraw() public onlyOwner {
        // Get the current balance of the contract
        uint256 contractBalance = address(this).balance;
        // Require that the balance is greater than zero to prevent failed transfers
        require(contractBalance > 0, "No funds to withdraw");
        // Transfer the entire balance to the owner's address
        payable(owner).transfer(contractBalance);
    }

    // onlyOwner modifier: Ensures that only the contract's owner can call the function.
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _; // Continues execution of the function it modifies
    }

    // getBalance() public view returns (uint256): Returns the current Ether balance of the contract.
    // `view` means it doesn't modify state and costs no gas to call.
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

