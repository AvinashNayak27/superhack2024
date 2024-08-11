// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserAggregator {
    address public owner;

    struct User {
        address userAddress;
        string sub;
        string postalCode;
    }

    mapping(address => User) private users;
    mapping(string => address) private subToAddress;
    mapping(address => bool) private existingUsers;

    // Event emitted when a user is created
    event UserCreated(
        address indexed userAddress,
        string sub,
        string postalCode
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Function to create a new user
    function createUser(
        address userAddress,
        string memory _sub,
        string memory _postalCode
    ) public onlyOwner {
        require(subToAddress[_sub] == address(0), "Sub already in use");
        require(!existingUsers[userAddress], "User address already in use");

        users[userAddress] = User({
            userAddress: userAddress,
            sub: _sub,
            postalCode: _postalCode
        });

        // Record the new sub and address
        subToAddress[_sub] = userAddress;
        existingUsers[userAddress] = true;

        emit UserCreated(userAddress, _sub, _postalCode);
    }

    // Function to get the user's data
    function getUser(address _userAddress) public view returns (User memory) {
        return users[_userAddress];
    }
}
