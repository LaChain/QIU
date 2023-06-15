// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Qiu is Ownable, Pausable {
    bytes32[] public entities;
    // Struct to hold information about an entity
    struct EntityInfo {
        bytes32 domainHash;
        address entityAddress;
        bool disable;
        uint256 nonce;
        string domain;
        bytes publicKey;
    }

    enum Status {
        Pending,
        Completed,
        Cancelled
    }

    mapping(bytes32 => EntityInfo) public domainHashToEntity;

    // ERC20 token address
    address private tokenAddress;

    struct Transfer {
        bytes32 originDomainHash;
        bytes32 destinationDomainHash;
        uint256 amount;
        bytes encryptedOrigin;
        bytes encryptedDestination;
        uint256 nonce;
        uint256 expiration;
        Status status;
        string externalRef;
    }

    mapping(bytes32 => Transfer) public transfers;

    event EntityUpdated(
        bytes32 indexed domainHash,
        address indexed entityAddress,
        string domain,
        bytes publicKey
    );

    event NewTransferRequest(
        bytes32 indexed transferHash,
        bytes32 indexed originDomainHash,
        bytes32 indexed destinationDomainHash,
        uint256 amount,
        bytes encryptedOrigin,
        bytes encryptedDestination,
        uint256 nonce,
        uint256 expiration,
        string externalRef
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
        string memory _domain,
        address _entityAddress,
        bytes memory _publicKey
    ) public onlyOwner whenNotPaused {
        require(bytes(_domain).length > 0, "domain can not be empty");
        bytes32 domainHash = keccak256(bytes(_domain));
        EntityInfo storage entity = domainHashToEntity[domainHash];

        require(entity.entityAddress == address(0), "entity already exists");

        entity.domainHash = domainHash;
        entity.entityAddress = _entityAddress;
        entity.domain = _domain;
        entity.publicKey = _publicKey;

        entities.push(domainHash);

        emit EntityUpdated(domainHash, _entityAddress, _domain, _publicKey);
    }

    // Disable an existing entity (only owner)
    function disableEntity(
        string memory _domain
    ) external onlyOwner whenNotPaused {
        bytes32 domainHash = getDomainHash(_domain);
        EntityInfo storage entity = domainHashToEntity[domainHash];
        require(entity.entityAddress != address(0), "entity does not exist");
        entity.disable = true;
    }

    // Create multiple transfer requests at once (sender)
    function batchTransferRequest(
        string[] memory _originDomains,
        string[] memory _destinationDomains,
        uint256[] memory _amounts,
        bytes[] memory _encryptedOrigins,
        bytes[] memory _encryptedDestinations,
        uint256[] memory _expirations,
        string[] memory _externalRefs
    ) external whenNotPaused returns (bytes32[] memory) {
        require(
            _originDomains.length == _destinationDomains.length &&
                _originDomains.length == _amounts.length &&
                _originDomains.length == _encryptedOrigins.length &&
                _originDomains.length == _encryptedDestinations.length &&
                _originDomains.length == _expirations.length &&
                _originDomains.length == _externalRefs.length,
            "All arrays must have the same length"
        );

        bytes32[] memory transferHashes = new bytes32[](_originDomains.length);

        for (uint256 i = 0; i < _originDomains.length; i++) {
            bytes32 transferHash = transferRequest(
                _originDomains[i],
                _destinationDomains[i],
                _amounts[i],
                _encryptedOrigins[i],
                _encryptedDestinations[i],
                _expirations[i],
                _externalRefs[i]
            );

            transferHashes[i] = transferHash;
        }
        return transferHashes;
    }

    // Create a new transfer request (sender)
    // _encrtyptedOrigin and _encrtyptedDestination are encryped with destination public key
    function transferRequest(
        string memory _originDomain,
        string memory _destinationDomain,
        uint256 _amount,
        bytes memory _encryptedOrigin,
        bytes memory _encryptedDestination,
        uint256 _expiration,
        string memory _externalRef
    ) private returns (bytes32) {
        bytes32 originDomainHash = getDomainHash(_originDomain);
        bytes32 destinationDomainHash = getDomainHash(_destinationDomain);

        // Check that origin and destination are different
        require(
            originDomainHash != destinationDomainHash,
            "origin and destination are the same"
        );

        EntityInfo storage originInfo = domainHashToEntity[originDomainHash];

        // Check that origin is in registry and enabled, and auhorized to create request
        requireIsValidEntity(originInfo.entityAddress, originInfo.disable);
        requireIsAuthorized(originInfo.entityAddress, msg.sender);

        {
            // Check that destination is in registry and enabled
            EntityInfo memory destinationInfo = domainHashToEntity[
                destinationDomainHash
            ];
            requireIsValidEntity(
                destinationInfo.entityAddress,
                destinationInfo.disable
            );
        }

        // Check that amount is greater than 0
        require(_amount > 0, "amount must be greater than 0");

        // Check that expiration is greater than 0
        require(_expiration > 0, "expiration must be greater than 0");

        // Create transfer request
        bytes32 transferHash = keccak256(
            abi.encodePacked(
                msg.sender,
                originDomainHash,
                destinationDomainHash,
                _amount,
                _encryptedOrigin,
                _encryptedDestination,
                originInfo.nonce,
                _expiration
            )
        );
        uint256 transferNonce = originInfo.nonce;
        {
            Transfer storage transfer = transfers[transferHash];

            require(
                transfer.originDomainHash == bytes32(0),
                "transfer already created"
            );

            transfer.originDomainHash = originDomainHash;
            transfer.destinationDomainHash = destinationDomainHash;
            transfer.amount = _amount;
            transfer.encryptedOrigin = _encryptedOrigin;
            transfer.encryptedDestination = _encryptedDestination;
            transfer.nonce = transferNonce;
            transfer.expiration = block.timestamp + _expiration;
            transfer.status = Status.Pending;
            transfer.externalRef = _externalRef;

            originInfo.nonce += 1;
        }
        // Transfer the tokens from origin to the contract using SafeERC20
        SafeERC20.safeTransferFrom(
            IERC20(tokenAddress),
            msg.sender,
            address(this),
            _amount
        );

        emit NewTransferRequest(
            transferHash,
            originDomainHash,
            destinationDomainHash,
            _amount,
            _encryptedOrigin,
            _encryptedDestination,
            transferNonce,
            _expiration,
            _externalRef
        );

        return transferHash;
    }

    // Accept multiple transfer requests at once (destination)
    function batchAcceptTransfer(
        bytes32[] calldata _transferHashes
    ) external whenNotPaused {
        for (uint256 i = 0; i < _transferHashes.length; i++) {
            acceptTransfer(_transferHashes[i]);
        }
    }

    // Cancel multiple transfer requests at once (destination)
    function batchCancelTransfer(
        bytes32[] calldata _transferHashes
    ) external whenNotPaused {
        for (uint256 i = 0; i < _transferHashes.length; i++) {
            cancelTransfer(_transferHashes[i]);
        }
    }

    // Destination address can acceptTransfer from a transfer request
    function acceptTransfer(bytes32 _transferHash) private {
        Transfer storage transfer = transfers[_transferHash];

        // Check that destination is in registry and enabled
        EntityInfo memory destinationInfo = domainHashToEntity[
            transfer.destinationDomainHash
        ];
        requireIsValidEntity(
            destinationInfo.entityAddress,
            destinationInfo.disable
        );
        requireIsAuthorized(destinationInfo.entityAddress, msg.sender);

        // Check that destination for transfer is the same as msg.sender
        require(destinationInfo.entityAddress == msg.sender, "not authorized");

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
            destinationInfo.entityAddress,
            transfer.amount
        );

        emit TransferAccepted(_transferHash, destinationInfo.entityAddress);
    }

    // Cancel a transfer request and get back tokens (sender)
    function cancelTransfer(bytes32 _transferHash) private {
        Transfer storage transfer = transfers[_transferHash];

        EntityInfo memory originInfo = domainHashToEntity[
            transfer.originDomainHash
        ];
        requireIsValidEntity(originInfo.entityAddress, originInfo.disable);
        requireIsAuthorized(originInfo.entityAddress, msg.sender);

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
            originInfo.entityAddress,
            transfer.amount
        );

        emit TransferCancelled(_transferHash, originInfo.entityAddress);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getAllEntities() public view returns (EntityInfo[] memory) {
        EntityInfo[] memory allEntities = new EntityInfo[](entities.length);

        for (uint256 i = 0; i < entities.length; i++) {
            allEntities[i] = domainHashToEntity[entities[i]];
        }
        return allEntities;
    }

    function getEntity(
        bytes32 domainHash
    ) public view returns (EntityInfo memory) {
        return domainHashToEntity[domainHash];
    }

    function getTransfer(
        bytes32 transferHash
    ) public view returns (Transfer memory) {
        return transfers[transferHash];
    }

    // function to get domainHash from domain
    function getDomainHash(
        string memory _domain
    ) public pure returns (bytes32) {
        return keccak256(bytes(_domain));
    }

    // Function to check if entity is authorized
    function requireIsAuthorized(
        address entityAddress,
        address sender
    ) private pure {
        require(entityAddress == sender, "Not authorized");
    }

    // Function to check if entity is valid (is registered and enabled)
    function requireIsValidEntity(
        address entityAddress,
        bool entityDisable
    ) private pure {
        // Require entity to be registered
        require(entityAddress != address(0), "Entity not registered");
        // Require entity to be enabled
        require(!entityDisable, "Entity disabled");
    }
}
