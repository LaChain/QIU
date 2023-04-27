const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { createIdentity, encrypt, decrypt } = require("./utils");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

function bn(x) {
  return ethers.BigNumber.from(x);
}

describe("Test LocalCoinSettlementV2", function () {
  async function deployFixture() {
    [owner] = await hre.ethers.getSigners();

    ent1 = createIdentity();
    ent2 = createIdentity();
    ent3 = createIdentity();
    const provider = hre.ethers.provider;
    entity1 = new hre.ethers.Wallet(ent1.privateKey).connect(provider);
    entity2 = new hre.ethers.Wallet(ent2.privateKey).connect(provider);
    entity3 = new hre.ethers.Wallet(ent3.privateKey).connect(provider);

    const amount = ethers.utils.parseEther("1"); // 1 ETH
    await owner.sendTransaction({
      to: entity1.address,
      value: amount,
    });
    await owner.sendTransaction({
      to: entity2.address,
      value: amount,
    });
    await owner.sendTransaction({
      to: entity3.address,
      value: amount,
    });

    const initialBalance = bn("100000000").mul("1000000000000000000");

    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const tERC20 = await MockERC20.deploy(
      "Num Ars",
      "NARS",
      owner.address,
      initialBalance
    );
    await tERC20.deployed();

    const LocalCoinSettlementV2 = await hre.ethers.getContractFactory(
      "LocalCoinSettlementV2"
    );
    const lcs = await LocalCoinSettlementV2.connect(owner).deploy(
      tERC20.address
    );
    await lcs.deployed();
    await tERC20
      .connect(owner)
      .transfer(ent1.address, ethers.utils.parseEther("1"));
    await tERC20
      .connect(owner)
      .transfer(ent1.address, ethers.utils.parseEther("1"));
    await tERC20
      .connect(owner)
      .transfer(ent1.address, ethers.utils.parseEther("1"));
    // Fixtures can return anything you consider useful for your tests
    return {
      owner,
      ent1,
      ent2,
      ent3,
      entity1,
      entity2,
      entity3,
      tERC20,
      lcs,
    };
  }

  async function newTransferRequest(
    tERC20,
    lcs,
    entityOrigin,
    originDomain,
    destinationDomain,
    tokenAmount,
    encryptedOrigin,
    encryptedDestination,
    expirationTime,
    externalReference
  ) {
    // approve tokens
    await tERC20.connect(entityOrigin).approve(lcs.address, tokenAmount);
    const originDomainHash = await lcs.getDomainHash(originDomain);
    const destinationDomainHash = await lcs.getDomainHash(destinationDomain);
    const entityInfo = await lcs.domainHashToEntity(originDomainHash);

    const transferHash = ethers.utils.solidityKeccak256(
      [
        "address",
        "bytes32",
        "bytes32",
        "uint256",
        "bytes",
        "bytes",
        "uint224",
        "uint256",
      ],
      [
        entityOrigin.address,
        originDomainHash,
        destinationDomainHash,
        tokenAmount,
        encryptedOrigin,
        encryptedDestination,
        entityInfo.nonce,
        expirationTime,
      ]
    );

    await lcs
      .connect(entityOrigin)
      .transferRequest(
        originDomain,
        destinationDomain,
        tokenAmount,
        encryptedOrigin,
        encryptedDestination,
        expirationTime,
        externalReference
      );

    return transferHash;
  }

  async function deployFixtureAndTransferRequest() {
    const { owner, ent1, ent2, ent3, entity1, entity2, entity3, tERC20, lcs } =
      await deployFixture();

    // register origin and destination
    const providerId = "00000031";
    const originDomain = "entity1.cvu";
    const pubKey = "0x" + ent1.publicKey;
    await lcs
      .connect(owner)
      .registerEntity(originDomain, ent1.address, providerId, pubKey);

    const providerId2 = "00001478";
    const destinationDomain = "entity2.cvu";
    const pubKey2 = "0x" + ent2.publicKey;
    await lcs
      .connect(owner)
      .registerEntity(destinationDomain, ent2.address, providerId2, pubKey2);

    const tokenAmount = "1";
    const encryptedOrigin = "0x";
    const encryptedDestination = "0x";
    const expiryTime = (await time.latest()) + ONE_WEEK_IN_SECS + 1;
    const externalReference = "0x";
    // approve tokens
    await tERC20.connect(entity1).approve(lcs.address, tokenAmount);

    const originDomainHash = await lcs.getDomainHash(originDomain);
    const destinationDomainHash = await lcs.getDomainHash(destinationDomain);

    const entity1Info = await lcs.domainHashToEntity(originDomainHash);

    const transferHash = ethers.utils.solidityKeccak256(
      [
        "address",
        "bytes32",
        "bytes32",
        "uint256",
        "bytes",
        "bytes",
        "uint224",
        "uint256",
      ],
      [
        entity1Info.entityAddress,
        originDomainHash,
        destinationDomainHash,
        tokenAmount,
        encryptedOrigin,
        encryptedDestination,
        entity1Info.nonce,
        ONE_WEEK_IN_SECS,
      ]
    );
    await expect(
      lcs
        .connect(entity1)
        .transferRequest(
          originDomain,
          destinationDomain,
          tokenAmount,
          encryptedOrigin,
          encryptedDestination,
          ONE_WEEK_IN_SECS,
          externalReference
        )
    )
      .to.emit(lcs, "NewTransferRequest")
      .withArgs(
        transferHash,
        originDomainHash,
        destinationDomainHash,
        tokenAmount,
        encryptedOrigin,
        encryptedDestination,
        entity1Info.nonce,
        ONE_WEEK_IN_SECS,
        externalReference
      );

    return {
      ent1,
      ent2,
      ent3,
      entity1,
      entity2,
      entity3,
      lcs,
      tERC20,
      originDomain,
      destinationDomain,
      tokenAmount,
      encryptedOrigin,
      encryptedDestination,
      transferHash,
      entity1Info,
      expiryTime,
    };
  }

  async function registerEntity(domain, providerId, pubkey, lcs, owner, ent) {
    return await lcs
      .connect(owner)
      .registerEntity(domain, ent.address, providerId, pubkey);
  }

  const ONE_WEEK_IN_SECS = 7 * 24 * 60 * 60;

  describe("Test register entity", function () {
    it("Revert - Only Owner can register a new entity", async function () {
      const { entity1, lcs, ent1 } = await loadFixture(deployFixture);

      const providerId = "00000031";
      const domain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;

      await expect(
        lcs
          .connect(entity1)
          .registerEntity(domain, ent1.address, providerId, pubKey)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("Should register a new entity", async function () {
      const { owner, ent1, lcs } = await loadFixture(deployFixture);

      const providerId = "00000031";
      const domain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;

      const domainHash = await lcs.getDomainHash(domain);

      await expect(
        lcs
          .connect(owner)
          .registerEntity(domain, ent1.address, providerId, pubKey)
      )
        .to.emit(lcs, "EntityUpdated")
        .withArgs(domainHash, ent1.address, bn(providerId), domain, pubKey);
    });
  });

  describe("Test new transfer request", function () {
    it("Revert - Origin domain and destination de same are equal", async function () {
      const { entity1, lcs } = await loadFixture(deployFixture);

      await expect(
        lcs
          .connect(entity1)
          .transferRequest(
            "entity1.cvu",
            "entity1.cvu",
            "1",
            "0x",
            "0x",
            ONE_WEEK_IN_SECS,
            "0x"
          )
      ).to.be.revertedWith("origin and destination are the same");
    });
    it("Revert - Origin entity not registered", async function () {
      const { entity1, lcs } = await loadFixture(deployFixture);

      await expect(
        lcs
          .connect(entity1)
          .transferRequest(
            "entity1.cvu",
            "entity2.cvu",
            "1",
            "0x",
            "0x",
            ONE_WEEK_IN_SECS,
            "0x"
          )
      ).to.be.revertedWith("Entity not registered");
    });
    it("Revert - Origin entity is disable", async function () {
      const { entity1, lcs, owner, ent1 } = await loadFixture(deployFixture);
      const providerId = "00000031";
      const domain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;

      await registerEntity(domain, providerId, pubKey, lcs, owner, ent1);
      await lcs.connect(owner).disableEntity(domain);

      await expect(
        lcs
          .connect(entity1)
          .transferRequest(
            domain,
            "entity2.cvu",
            "1",
            "0x",
            "0x",
            ONE_WEEK_IN_SECS,
            "0x"
          )
      ).to.be.revertedWith("Entity disabled");
    });

    it("Revert - Origin sender should be equal than msg.sender", async function () {
      const { lcs, owner, ent1 } = await loadFixture(deployFixture);
      const providerId = "00000031";
      const domain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;

      await registerEntity(domain, providerId, pubKey, lcs, owner, ent1);

      await expect(
        lcs
          .connect(owner)
          .transferRequest(
            domain,
            "entity2.cvu",
            "1",
            "0x",
            "0x",
            ONE_WEEK_IN_SECS,
            "0x"
          )
      ).to.be.revertedWith("Not authorized");
    });

    it("Revert - Destination entity not registered", async function () {
      const { lcs, owner, ent1, entity1 } = await loadFixture(deployFixture);

      const providerId = "00000031";
      const domain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;
      await registerEntity(domain, providerId, pubKey, lcs, owner, ent1);

      await expect(
        lcs
          .connect(entity1)
          .transferRequest(
            "entity1.cvu",
            "entity2.cvu",
            "1",
            "0x",
            "0x",
            ONE_WEEK_IN_SECS,
            "0x"
          )
      ).to.be.revertedWith("Entity not registered");
    });

    it("Revert - Destination entity is disable", async function () {
      const { entity1, lcs, owner, ent1, ent2 } = await loadFixture(
        deployFixture
      );
      const providerId = "00000031";
      const domain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;

      await registerEntity(domain, providerId, pubKey, lcs, owner, ent1);

      const providerId2 = "00001478";
      const domain2 = "entity2.cvu";
      const pubKey2 = "0x" + ent2.publicKey;

      await registerEntity(domain2, providerId2, pubKey2, lcs, owner, ent2);
      await lcs.connect(owner).disableEntity(domain2);

      await expect(
        lcs
          .connect(entity1)
          .transferRequest(
            domain,
            domain2,
            "1",
            "0x",
            "0x",
            ONE_WEEK_IN_SECS,
            "0x"
          )
      ).to.be.revertedWith("Entity disabled");
    });

    it("Revert - Not enought allowance to transfer", async function () {
      const { owner, entity1, ent1, ent2, lcs } = await loadFixture(
        deployFixture
      );

      // register origin and destination
      const providerId = "00000031";
      const domain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;

      await registerEntity(domain, providerId, pubKey, lcs, owner, ent1);

      const providerId2 = "00001478";
      const domain2 = "entity2.cvu";
      const pubKey2 = "0x" + ent2.publicKey;

      await registerEntity(domain2, providerId2, pubKey2, lcs, owner, ent2);

      await expect(
        lcs
          .connect(entity1)
          .transferRequest(
            domain,
            domain2,
            "1",
            "0x",
            "0x",
            ONE_WEEK_IN_SECS,
            "0x"
          )
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
    it("should transfer tokens from ent1 to contract and emit transferRequest event", async function () {
      const { lcs, tERC20, tokenAmount, transferHash, originDomain } =
        await loadFixture(deployFixtureAndTransferRequest);

      const entity1InfoAfter = await lcs.domainHashToEntity(
        await lcs.getDomainHash(originDomain)
      );
      assert.equal(entity1InfoAfter.nonce, 1);
      assert.equal(await tERC20.balanceOf(lcs.address), tokenAmount);
      const transferInfo = await lcs.transfers(transferHash);
      assert.equal(transferInfo.status, 0);
    });
  });

  describe("Test batchAcceptTransfer function", function () {
    it("should fail if destination for transfer is not the same as msg.sender", async function () {
      const { entity1, transferHash, lcs } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await expect(
        lcs.connect(entity1).batchAcceptTransfer([transferHash])
      ).to.be.revertedWith("Not authorized");
    });
    it("should fail if transfer request is expired", async function () {
      const { entity2, transferHash, lcs, expiryTime } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await time.increaseTo(expiryTime);

      await expect(
        lcs.connect(entity2).batchAcceptTransfer([transferHash])
      ).to.be.revertedWith("transfer expired");
    });
    it("should fail if transfer status is not pending", async function () {
      const { entity2, transferHash, lcs } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await lcs.connect(entity2).batchAcceptTransfer([transferHash]);

      await expect(
        lcs.connect(entity2).batchAcceptTransfer([transferHash])
      ).to.be.revertedWith("transfer already completed or cancelled");
    });
    it("should batchAcceptTransfer sucessfully and emit event", async function () {
      const { entity2, ent2, transferHash, lcs, tERC20, tokenAmount } =
        await loadFixture(deployFixtureAndTransferRequest);

      const balanceBefore = await tERC20.balanceOf(ent2.address);

      await expect(lcs.connect(entity2).batchAcceptTransfer([transferHash]))
        .to.emit(lcs, "TransferAccepted")
        .withArgs(transferHash, ent2.address);

      const balanceAfter = await tERC20.balanceOf(ent2.address);
      expect(bn(balanceBefore).add(tokenAmount), balanceAfter).to.be.equal;
      const transferInfo = await lcs.transfers(transferHash);
      assert.equal(transferInfo.status, 1);
    });
    it("should batchAcceptTransfer sucessfully many transfers", async function () {
      const {
        entity1,
        entity2,
        ent2,
        transferHash,
        lcs,
        tERC20,
        tokenAmount,
        originDomain,
        destinationDomain,
      } = await loadFixture(deployFixtureAndTransferRequest);

      const balanceBefore = await tERC20.balanceOf(ent2.address);

      const transferHash2 = await newTransferRequest(
        tERC20,
        lcs,
        entity1,
        originDomain,
        destinationDomain,
        tokenAmount,
        "0x",
        "0x",
        ONE_WEEK_IN_SECS,
        "0x"
      );
      await await lcs
        .connect(entity2)
        .batchAcceptTransfer([transferHash, transferHash2]);

      const balanceAfter = await tERC20.balanceOf(ent2.address);
      expect(bn(balanceBefore).add(tokenAmount * 2), balanceAfter).to.be.equal;
      const transferInfo1 = await lcs.transfers(transferHash);
      assert.equal(transferInfo1.status, 1);
      const transferInfo2 = await lcs.transfers(transferHash2);
      assert.equal(transferInfo2.status, 1);
    });
  });

  describe("Test batchCancelTransfer function", function () {
    it("should fail if sender is not the same as origin for transfer", async function () {
      const { entity2, transferHash, lcs } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await expect(
        lcs.connect(entity2).batchCancelTransfer([transferHash])
      ).to.be.revertedWith("Not authorized");
    });
    it("should fail if origin tries to batchCancelTransfer before it expires", async function () {
      const { entity1, transferHash, lcs } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await expect(
        lcs.connect(entity1).batchCancelTransfer([transferHash])
      ).to.be.revertedWith("transfer not expired");
    });
    it("should fail if transfer is not status pending", async function () {
      const { entity1, entity2, transferHash, lcs, expiryTime } =
        await loadFixture(deployFixtureAndTransferRequest);

      await lcs.connect(entity2).batchAcceptTransfer([transferHash]);
      await time.increaseTo(expiryTime);

      await expect(
        lcs.connect(entity1).batchCancelTransfer([transferHash])
      ).to.be.revertedWith("transfer already completed or cancelled");
    });
    it("origin should be able to batchCancelTransfer after it expires", async function () {
      const { entity1, ent1, transferHash, lcs, expiryTime, tERC20 } =
        await loadFixture(deployFixtureAndTransferRequest);

      await time.increaseTo(expiryTime);

      await expect(lcs.connect(entity1).batchCancelTransfer([transferHash]))
        .to.emit(lcs, "TransferCancelled")
        .withArgs(transferHash, ent1.address);

      assert.equal(await tERC20.balanceOf(lcs.address), 0);
      const transferInfo = await lcs.transfers(transferHash);
      assert.equal(transferInfo.status, 2);
    });
    it("should batch cancel many transfers after it expires", async function () {
      const {
        entity1,
        transferHash,
        lcs,
        tERC20,
        tokenAmount,
        originDomain,
        destinationDomain,
      } = await loadFixture(deployFixtureAndTransferRequest);

      const transferHash2 = await newTransferRequest(
        tERC20,
        lcs,
        entity1,
        originDomain,
        destinationDomain,
        tokenAmount,
        "0x",
        "0x",
        ONE_WEEK_IN_SECS,
        "0x"
      );

      const transferInfo2before = await lcs.transfers(transferHash2);
      await time.increaseTo(bn(transferInfo2before.expiration).add(1));

      await lcs
        .connect(entity1)
        .batchCancelTransfer([transferHash, transferHash2]);

      assert.equal(await tERC20.balanceOf(lcs.address), 0);
      const transferInfo1 = await lcs.transfers(transferHash);
      const transferInfo2 = await lcs.transfers(transferHash);
      assert.equal(transferInfo1.status, 2);
      assert.equal(transferInfo2.status, 2);
    });
  });

  describe("e2e - Transfer and accept using encryptation", function () {
    it("Should use alias for transfers", async function () {
      const { owner, ent1, ent2, entity1, entity2, tERC20, lcs } =
        await loadFixture(deployFixture);

      // register origin and destination
      const providerId = "00000031";
      const originDomain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;
      await lcs
        .connect(owner)
        .registerEntity(originDomain, ent1.address, providerId, pubKey);

      const providerId2 = "00001478";
      const destinationDomain = "entity2.cvu";
      const pubKey2 = "0x" + ent2.publicKey;
      await lcs
        .connect(owner)
        .registerEntity(destinationDomain, ent2.address, providerId2, pubKey2);

      const userOrigin = "user_alias_ori";
      const userDest = "user_alias_dest";
      const tokenAmount = "1";

      const encryptedOrigin =
        "0x" + (await encrypt(ent2.publicKey, userOrigin));
      const encryptedDestination =
        "0x" + (await encrypt(ent2.publicKey, userDest));

      const expiryTime = (await time.latest()) + ONE_WEEK_IN_SECS + 1;
      const externalReference = "0x";

      const transferHash = await newTransferRequest(
        tERC20,
        lcs,
        entity1,
        originDomain,
        destinationDomain,
        tokenAmount,
        encryptedOrigin,
        encryptedDestination,
        expiryTime,
        externalReference
      );
      const balanceBefore = await tERC20.balanceOf(entity2.address);
      await lcs.connect(entity2).batchAcceptTransfer([transferHash]);

      const balanceAfter = await tERC20.balanceOf(entity2.address);
      expect(bn(balanceBefore).add(tokenAmount), balanceAfter).to.be.equal;

      const decryptOrigin = await decrypt(entity2.privateKey, encryptedOrigin);
      const decryptDestination = await decrypt(
        entity2.privateKey,
        encryptedDestination
      );
      assert.equal(decryptOrigin, userOrigin);
      assert.equal(decryptDestination, userDest);
    });
  });
});
