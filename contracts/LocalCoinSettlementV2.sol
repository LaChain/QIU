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

    enum Status {
        Pending,
        Completed,
        Cancelled
    }

    mapping(address => Entity) public entities;

    // ERC20 token address
    address private tokenAddress;

    struct Transfer {
        address origin;
        address destination;
        uint256 amount;
        bytes encryptedOrigin;
        bytes encryptedDestination;
        uint256 nonce;
        uint256 expiration;
        Status status;
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
        bytes encryptedOrigin,
        bytes encryptedDestination,
        uint256 nonce,
        uint256 expiration
    );

    event TransferAccepted(
        bytes32 indexed transferHash,
        address indexed recipient
    );

    event TransferCancelled(
        bytes32 indexed transferHash,
        address indexed sender
    );

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
        bytes memory _encryptedOrigin,
        bytes memory _encryptedDestination,
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
                _encryptedOrigin,
                _encryptedDestination,
                originInfo.nonce,
                _expiration
            )
        );
        Transfer storage transfer = transfers[transferHash];
        require(transfer.origin == address(0), "transfer already created");

        transfer.origin = msg.sender;
        transfer.destination = _destination;
        transfer.amount = _amount;
        transfer.encryptedOrigin = _encryptedOrigin;
        transfer.encryptedDestination = _encryptedDestination;
        transfer.nonce = originInfo.nonce;
        transfer.expiration = block.timestamp + _expiration;
        transfer.status = Status.Pending;

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
            _encryptedOrigin,
            _encryptedDestination,
            transfer.nonce,
            _expiration
        );

        return transferHash;
    }

    // Accept multiple transfer requests at once (destination)
    function batchAcceptTransfer(bytes32[] calldata _transferHashes) external {
        for (uint256 i = 0; i < _transferHashes.length; i++) {
            acceptTransfer(_transferHashes[i]);
        }
    }

    // Cancel multiple transfer requests at once (destination)
    function batchCancelTransfer(bytes32[] calldata _transferHashes) external {
        for (uint256 i = 0; i < _transferHashes.length; i++) {
            cancelTransfer(_transferHashes[i]);
        }
    }

    // Destination address can acceptTransfer from a transfer request
    function acceptTransfer(bytes32 _transferHash) private {
        Transfer storage transfer = transfers[_transferHash];

        // Check that destination for transfer is the same as msg.sender
        require(transfer.destination == msg.sender, "not authorized");

        // Check that transfer has not expired
        require(block.timestamp < transfer.expiration, "transfer expired");

        // Check that transfer has not been completed or cancelled already
        require(
            transfer.status == Status.Pending,
            "transfer already completed or cancelled"
        );

        // Mark transfer status as completed
        transfer.status = Status.Completed;

        // Transfer the tokens to the destination using SafeERC20
        SafeERC20.safeTransfer(
            IERC20(tokenAddress),
            transfer.destination,
            transfer.amount
        );

        emit TransferAccepted(_transferHash, transfer.destination);
    }

    // Cancel a transfer request and get back tokens (sender)
    function cancelTransfer(bytes32 _transferHash) private {
        Transfer storage transfer = transfers[_transferHash];

        // Check sender is the same as origin for transfer
        require(transfer.origin == msg.sender, "not authorized");

        // Check that transfer has expired
        require(block.timestamp >= transfer.expiration, "transfer not expired");

        // Check that transfer has not been completed or cancelled already
        require(
            transfer.status == Status.Pending,
            "transfer already completed or cancelled"
        );

        // Mark transfer status as cancelled
        transfer.status = Status.Cancelled;

        // Transfer the tokens back to the sender using SafeERC20
        SafeERC20.safeTransfer(
            IERC20(tokenAddress),
            transfer.origin,
            transfer.amount
        );

        emit TransferCancelled(_transferHash, transfer.origin);
    }
}
