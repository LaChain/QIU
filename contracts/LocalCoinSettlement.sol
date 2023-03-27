// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LocalCoinSettlement is Ownable {
    // Struct to hold information about an entity
    struct Entity {
        uint32 entityId;
        uint224 nonce;
        bytes publicKey;
    }

    mapping(address => Entity) public entities;

    // ERC20 token address
    address private tokenAddress;

    event NewEntity(
        address indexed entityAddress,
        uint32 indexed entityID,
        bytes publicKey
    );

    event LogTransfer(
        address indexed origin,
        address indexed destination,
        uint256 amount,
        bytes encrtyptedCvuOrigin,
        bytes encrtyptedCvuDestination,
        uint256 nonce
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

    // Transfer tokens from a sender to a recipient entity
    // _encrtyptedCvuOrigin and _encrtyptedCvuDestination are encryped with destination public key
    function transfer(
        address _destination,
        uint256 _amount,
        bytes memory _encrtyptedCvuOrigin,
        bytes memory _encrtyptedCvuDestination
    ) external {
        Entity storage originInfo = entities[msg.sender];
        uint256 transferNonce = originInfo.nonce;
        originInfo.nonce = originInfo.nonce + 1;

        // Check origin is in registry
        require(originInfo.entityId != 0, "origin not register");

        // Check destination is in registry
        Entity memory destinationInfo = entities[_destination];
        require(destinationInfo.entityId != 0, "destination not register");

        // Transfer the tokens from the sender to the recipient using SafeERC20
        SafeERC20.safeTransferFrom(
            IERC20(tokenAddress),
            msg.sender,
            _destination,
            _amount
        );

        emit LogTransfer(
            msg.sender,
            _destination,
            _amount,
            _encrtyptedCvuOrigin,
            _encrtyptedCvuDestination,
            transferNonce
        );
    }
}
