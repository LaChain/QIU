// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LocalCoinSettlementV2 is Ownable {
    // Struct to hold information about an entity
    struct Entity {
        uint32 entityId;
        uint224 nonce;
        bytes publicKey;
    }

    mapping(address => Entity) public entities;

    // ERC20 token address
    address private tokenAddress;

    struct Transfer {
        address origin;
        address destination;
        uint256 amount;
        bytes encryptedCvuOrigin;
        bytes encryptedCvuDestination;
        uint256 nonce;
        uint256 expiration;
        bool completed;
    }

    mapping(bytes32 => Transfer) public transfers;

    event NewEntity(
        address indexed entityAddress,
        uint32 indexed entityId,
        bytes publicKey
    );

    event NewTransferRequest(
        bytes32 indexed transferHash,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        bytes encryptedCvuOrigin,
        bytes encryptedCvuDestination,
        uint256 nonce,
        uint256 expiration
    );

    event Withdraw(
        bytes32 indexed transferHash,
        address indexed recipient,
        bool success
    );

    event Refund(bytes32 indexed transferHash, address indexed sender);

    constructor(address _tokenAddress) Ownable() {
        tokenAddress = _tokenAddress;
    }

    // Register a new entity (only owner)
    function registerEntity(
        address _entityAddress,
        uint32 _entityId,
        bytes memory _publicKey
    ) public onlyOwner {
        require(_entityId != 0, "entityId can not be 0");
        Entity storage entity = entities[_entityAddress];
        entity.entityId = _entityId;
        entity.publicKey = _publicKey;

        emit NewEntity(_entityAddress, _entityId, _publicKey);
    }

    // Create a new transfer request (sender)
    // _encrtyptedCvuOrigin and _encrtyptedCvuDestination are encryped with destination public key
    function transferRequest(
        address _destination,
        uint256 _amount,
        bytes memory _encryptedCvuOrigin,
        bytes memory _encryptedCvuDestination,
        uint256 _expiration
    ) external returns (bytes32) {
        Entity storage originInfo = entities[msg.sender];

        // Check origin is in registry
        require(originInfo.entityId != 0, "origin entity not registered");

        // Check destination is in registry
        Entity memory destinationInfo = entities[_destination];
        require(
            destinationInfo.entityId != 0,
            "destination entity not registered"
        );

        // Create transfer request
        bytes32 transferHash = keccak256(
            abi.encodePacked(
                msg.sender,
                _destination,
                _amount,
                _encryptedCvuOrigin,
                _encryptedCvuDestination,
                originInfo.nonce,
                _expiration
            )
        );
        Transfer storage transfer = transfers[transferHash];
        require(!transfer.completed, "transfer already completed");

        transfer.origin = msg.sender;
        transfer.destination = _destination;
        transfer.amount = _amount;
        transfer.encryptedCvuOrigin = _encryptedCvuOrigin;
        transfer.encryptedCvuDestination = _encryptedCvuDestination;
        transfer.nonce = originInfo.nonce;
        transfer.expiration = block.timestamp + _expiration;
        transfer.completed = false;

        originInfo.nonce += 1;

        // Transfer the tokens from origin to the contract using SafeERC20
        SafeERC20.safeTransferFrom(
            IERC20(tokenAddress),
            msg.sender,
            address(this),
            _amount
        );

        emit NewTransferRequest(
            transferHash,
            msg.sender,
            _destination,
            _amount,
            _encryptedCvuOrigin,
            _encryptedCvuDestination,
            transfer.nonce,
            _expiration
        );

        return transferHash;
    }

    // Destination address can withdraw the tokens from the transfer request
    function withdraw(bytes32 _transferHash) external {
        Transfer storage transfer = transfers[_transferHash];

        // Check that destination for transfer is the same as msg.sender
        require(transfer.destination == msg.sender, "not authorized");

        // Check that transfer has not expired
        require(block.timestamp < transfer.expiration, "transfer expired");

        // Check that transfer has not been completed already
        require(!transfer.completed, "transfer already completed");

        // Mark transfer as completed
        transfer.completed = true;

        // Transfer the tokens to the destination using SafeERC20
        SafeERC20.safeTransfer(
            IERC20(tokenAddress),
            transfer.destination,
            transfer.amount
        );

        emit Withdraw(_transferHash, transfer.destination, true);
    }

    // Refund the tokens from the transfer (sender)
    function refund(bytes32 _transferHash) external {
        Transfer storage transfer = transfers[_transferHash];

        // Check sender is the same as origin for transfer
        require(transfer.origin == msg.sender, "not authorized");

        // Check that transfer has expired
        require(block.timestamp >= transfer.expiration, "transfer not expired");

        // Check that transfer has not been completed already
        require(!transfer.completed, "transfer already completed");

        // Mark transfer as completed
        transfer.completed = true;

        // Transfer the tokens back to the sender using SafeERC20
        SafeERC20.safeTransfer(
            IERC20(tokenAddress),
            transfer.origin,
            transfer.amount
        );

        emit Refund(_transferHash, transfer.origin);
    }
}
