const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const {
  createIdentity,
  encrypt,
  decrypt,
  getTransferHash,
} = require("./utils");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

function bn(x) {
  return ethers.BigNumber.from(x);
}

describe("Test Qiu", function () {
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

    const Qiu = await hre.ethers.getContractFactory("Qiu");
    const qiu = await Qiu.connect(owner).deploy(tERC20.address);
    await qiu.deployed();
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
      qiu,
    };
  }

  async function batchTransferRequest(
    tERC20,
    qiu,
    entityOrigins,
    originDomains,
    destinationDomains,
    tokenAmounts,
    encryptedOrigins,
    encryptedDestinations,
    expirationTimes,
    externalReferences
  ) {
    let transferHashes = [];
    let totalAmount = bn("0");
    // loop over all transfers
    for (let i = 0; i < tokenAmounts.length; i++) {
      const entityOrigin = entityOrigins[i];
      const originDomain = originDomains[i];
      const destinationDomain = destinationDomains[i];
      const tokenAmount = tokenAmounts[i];
      const encryptedOrigin = encryptedOrigins[i];
      const encryptedDestination = encryptedDestinations[i];
      const expirationTime = expirationTimes[i];

      const originDomainHash = await qiu.getDomainHash(originDomain);
      const destinationDomainHash = await qiu.getDomainHash(destinationDomain);
      const entityInfo = await qiu.domainHashToEntity(originDomainHash);

      const transferHash = getTransferHash(
        entityOrigin.address,
        originDomainHash,
        destinationDomainHash,
        tokenAmount,
        encryptedOrigin,
        encryptedDestination,
        entityInfo.nonce.add(i),
        expirationTime
      );

      transferHashes.push(transferHash);
      totalAmount = totalAmount.add(tokenAmount);
    }

    await tERC20.connect(entityOrigins[0]).approve(qiu.address, totalAmount);

    await qiu
      .connect(entityOrigins[0])
      .batchTransferRequest(
        originDomains,
        destinationDomains,
        tokenAmounts,
        encryptedOrigins,
        encryptedDestinations,
        expirationTimes,
        externalReferences
      );

    return transferHashes;
  }

  async function deployFixtureAndTransferRequest() {
    const { owner, ent1, ent2, ent3, entity1, entity2, entity3, tERC20, qiu } =
      await deployFixture();

    // register origin and destination
    const originDomain = "entity1.cvu";
    const pubKey = "0x" + ent1.publicKey;
    await qiu.connect(owner).registerEntity(originDomain, ent1.address, pubKey);

    const destinationDomain = "entity2.cvu";
    const pubKey2 = "0x" + ent2.publicKey;
    await qiu
      .connect(owner)
      .registerEntity(destinationDomain, ent2.address, pubKey2);

    const tokenAmount = "1";
    const encryptedOrigin = "0x";
    const encryptedDestination = "0x";
    const expiryTime = (await time.latest()) + ONE_WEEK_IN_SECS + 1;
    const externalReference = "0x";
    // approve tokens
    await tERC20.connect(entity1).approve(qiu.address, tokenAmount);

    const originDomainHash = await qiu.getDomainHash(originDomain);
    const destinationDomainHash = await qiu.getDomainHash(destinationDomain);

    const entity1Info = await qiu.domainHashToEntity(originDomainHash);

    const transferHash = ethers.utils.solidityKeccak256(
      [
        "address",
        "bytes32",
        "bytes32",
        "uint256",
        "bytes",
        "bytes",
        "uint256",
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
      qiu
        .connect(entity1)
        .batchTransferRequest(
          [originDomain],
          [destinationDomain],
          [tokenAmount],
          [encryptedOrigin],
          [encryptedDestination],
          [ONE_WEEK_IN_SECS],
          [externalReference]
        )
    )
      .to.emit(qiu, "NewTransferRequest")
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
      qiu,
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

  async function registerEntity(domain, pubkey, qiu, owner, ent) {
    return await qiu.connect(owner).registerEntity(domain, ent.address, pubkey);
  }

  const ONE_WEEK_IN_SECS = 7 * 24 * 60 * 60;

  describe("Test register entity", function () {
    it("Revert - Only Owner can register a new entity", async function () {
      const { entity1, qiu, ent1 } = await loadFixture(deployFixture);

      const domain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;

      await expect(
        qiu.connect(entity1).registerEntity(domain, ent1.address, pubKey)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("Should register a new entity", async function () {
      const { owner, ent1, qiu } = await loadFixture(deployFixture);

      const domain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;

      const domainHash = await qiu.getDomainHash(domain);

      await expect(
        qiu.connect(owner).registerEntity(domain, ent1.address, pubKey)
      )
        .to.emit(qiu, "EntityUpdated")
        .withArgs(domainHash, ent1.address, domain, pubKey);
    });
  });

  describe("Test new transfer request", function () {
    it("Revert - Origin domain and destination de same are equal", async function () {
      const { entity1, qiu } = await loadFixture(deployFixture);

      await expect(
        qiu
          .connect(entity1)
          .batchTransferRequest(
            ["entity1.cvu"],
            ["entity1.cvu"],
            ["1"],
            ["0x"],
            ["0x"],
            [ONE_WEEK_IN_SECS],
            ["0x"]
          )
      ).to.be.revertedWith("origin and destination are the same");
    });
    it("Revert - Origin entity not registered", async function () {
      const { entity1, qiu } = await loadFixture(deployFixture);

      await expect(
        qiu
          .connect(entity1)
          .batchTransferRequest(
            ["entity1.cvu"],
            ["entity2.cvu"],
            ["1"],
            ["0x"],
            ["0x"],
            [ONE_WEEK_IN_SECS],
            ["0x"]
          )
      ).to.be.revertedWith("Entity not registered");
    });
    it("Revert - Origin entity is disable", async function () {
      const { entity1, qiu, owner, ent1 } = await loadFixture(deployFixture);
      const domain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;

      await registerEntity(domain, pubKey, qiu, owner, ent1);
      await qiu.connect(owner).disableEntity(domain);

      await expect(
        qiu
          .connect(entity1)
          .batchTransferRequest(
            [domain],
            ["entity2.cvu"],
            ["1"],
            ["0x"],
            ["0x"],
            [ONE_WEEK_IN_SECS],
            ["0x"]
          )
      ).to.be.revertedWith("Entity disabled");
    });

    it("Revert - Origin sender should be equal than msg.sender", async function () {
      const { qiu, owner, ent1 } = await loadFixture(deployFixture);
      const domain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;

      await registerEntity(domain, pubKey, qiu, owner, ent1);

      await expect(
        qiu
          .connect(owner)
          .batchTransferRequest(
            [domain],
            ["entity2.cvu"],
            ["1"],
            ["0x"],
            ["0x"],
            [ONE_WEEK_IN_SECS],
            ["0x"]
          )
      ).to.be.revertedWith("Not authorized");
    });

    it("Revert - Destination entity not registered", async function () {
      const { qiu, owner, ent1, entity1 } = await loadFixture(deployFixture);

      const domain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;
      await registerEntity(domain, pubKey, qiu, owner, ent1);

      await expect(
        qiu
          .connect(entity1)
          .batchTransferRequest(
            ["entity1.cvu"],
            ["entity2.cvu"],
            ["1"],
            ["0x"],
            ["0x"],
            [ONE_WEEK_IN_SECS],
            ["0x"]
          )
      ).to.be.revertedWith("Entity not registered");
    });

    it("Revert - Destination entity is disable", async function () {
      const { entity1, qiu, owner, ent1, ent2 } = await loadFixture(
        deployFixture
      );
      const domain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;

      await registerEntity(domain, pubKey, qiu, owner, ent1);

      const domain2 = "entity2.cvu";
      const pubKey2 = "0x" + ent2.publicKey;

      await registerEntity(domain2, pubKey2, qiu, owner, ent2);
      await qiu.connect(owner).disableEntity(domain2);

      await expect(
        qiu
          .connect(entity1)
          .batchTransferRequest(
            [domain],
            [domain2],
            ["1"],
            ["0x"],
            ["0x"],
            [ONE_WEEK_IN_SECS],
            ["0x"]
          )
      ).to.be.revertedWith("Entity disabled");
    });

    it("Revert - Not enought allowance to transfer", async function () {
      const { owner, entity1, ent1, ent2, qiu } = await loadFixture(
        deployFixture
      );

      // register origin and destination
      const domain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;

      await registerEntity(domain, pubKey, qiu, owner, ent1);

      const domain2 = "entity2.cvu";
      const pubKey2 = "0x" + ent2.publicKey;

      await registerEntity(domain2, pubKey2, qiu, owner, ent2);

      await expect(
        qiu
          .connect(entity1)
          .batchTransferRequest(
            [domain],
            [domain2],
            ["1"],
            ["0x"],
            ["0x"],
            [ONE_WEEK_IN_SECS],
            ["0x"]
          )
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
    it("should transfer tokens from ent1 to contract and emit transferRequest event", async function () {
      const { qiu, tERC20, tokenAmount, transferHash, originDomain } =
        await loadFixture(deployFixtureAndTransferRequest);

      const entity1InfoAfter = await qiu.domainHashToEntity(
        await qiu.getDomainHash(originDomain)
      );
      assert.equal(entity1InfoAfter.nonce, 1);
      assert.equal(await tERC20.balanceOf(qiu.address), tokenAmount);
      const transferInfo = await qiu.transfers(transferHash);
      assert.equal(transferInfo.status, 0);
    });
    it("should create many transfer Requests", async function () {
      const {
        entity1,
        qiu,
        tERC20,
        originDomain,
        destinationDomain,
        encryptedOrigin,
        encryptedDestination,
        expiryTime,
      } = await loadFixture(deployFixtureAndTransferRequest);

      const transferHashes = await batchTransferRequest(
        tERC20,
        qiu,
        [entity1, entity1, entity1],
        [originDomain, originDomain, originDomain],
        [destinationDomain, destinationDomain, destinationDomain],
        ["1", "2", "3"],
        [encryptedOrigin, encryptedOrigin, encryptedOrigin],
        [encryptedDestination, encryptedDestination, encryptedDestination],
        [expiryTime, expiryTime, expiryTime],
        ["0x", "0x", "0x"]
      );
    });
    it("should create a high number of transfer Requests", async function () {
      const {
        entity1,
        qiu,
        tERC20,
        originDomain,
        destinationDomain,
        encryptedOrigin,
        encryptedDestination,
        expiryTime,
      } = await loadFixture(deployFixtureAndTransferRequest);

      let entities = [];
      let originDomains = [];
      let destinationDomains = [];
      let amounts = [];
      let encryptedOrigins = [];
      let encryptedDestinations = [];
      let expiryTimes = [];
      let data = [];

      for (let i = 0; i < 50; i++) {
        entities.push(entity1);
        originDomains.push(originDomain);
        destinationDomains.push(destinationDomain);
        amounts.push("1");
        encryptedOrigins.push(encryptedOrigin);
        encryptedDestinations.push(encryptedDestination);
        expiryTimes.push(expiryTime);
        data.push("0x");
      }

      const transferHashes = await batchTransferRequest(
        tERC20,
        qiu,
        entities,
        originDomains,
        destinationDomains,
        amounts,
        encryptedOrigins,
        encryptedDestinations,
        expiryTimes,
        data
      );
    });
  });

  describe("Test batchAcceptTransfer function", function () {
    it("should fail if destination for transfer is not the same as msg.sender", async function () {
      const { entity1, transferHash, qiu } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await expect(
        qiu.connect(entity1).batchAcceptTransfer([transferHash])
      ).to.be.revertedWith("Not authorized");
    });
    it("should fail if transfer request is expired", async function () {
      const { entity2, transferHash, qiu, expiryTime } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await time.increaseTo(expiryTime);

      await expect(
        qiu.connect(entity2).batchAcceptTransfer([transferHash])
      ).to.be.revertedWith("transfer expired");
    });
    it("should fail if transfer status is not pending", async function () {
      const { entity2, transferHash, qiu } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await qiu.connect(entity2).batchAcceptTransfer([transferHash]);

      await expect(
        qiu.connect(entity2).batchAcceptTransfer([transferHash])
      ).to.be.revertedWith("transfer already completed or cancelled");
    });
    it("should batchAcceptTransfer sucessfully and emit event", async function () {
      const { entity2, ent2, transferHash, qiu, tERC20, tokenAmount } =
        await loadFixture(deployFixtureAndTransferRequest);

      const balanceBefore = await tERC20.balanceOf(ent2.address);

      await expect(qiu.connect(entity2).batchAcceptTransfer([transferHash]))
        .to.emit(qiu, "TransferAccepted")
        .withArgs(transferHash, ent2.address);

      const balanceAfter = await tERC20.balanceOf(ent2.address);
      expect(bn(balanceBefore).add(tokenAmount), balanceAfter).to.be.equal;
      const transferInfo = await qiu.transfers(transferHash);
      assert.equal(transferInfo.status, 1);
    });
    it("should batchAcceptTransfer sucessfully many transfers", async function () {
      const {
        entity1,
        entity2,
        ent2,
        transferHash,
        qiu,
        tERC20,
        tokenAmount,
        originDomain,
        destinationDomain,
      } = await loadFixture(deployFixtureAndTransferRequest);

      const balanceBefore = await tERC20.balanceOf(ent2.address);

      const transferHashes = await batchTransferRequest(
        tERC20,
        qiu,
        [entity1],
        [originDomain],
        [destinationDomain],
        [tokenAmount],
        ["0x"],
        ["0x"],
        [ONE_WEEK_IN_SECS],
        ["0x"]
      );

      const transferHash2 = transferHashes[0];
      await await qiu
        .connect(entity2)
        .batchAcceptTransfer([transferHash, transferHash2]);

      const balanceAfter = await tERC20.balanceOf(ent2.address);
      expect(bn(balanceBefore).add(tokenAmount * 2), balanceAfter).to.be.equal;
      const transferInfo1 = await qiu.transfers(transferHash);
      assert.equal(transferInfo1.status, 1);
      const transferInfo2 = await qiu.transfers(transferHash2);
      assert.equal(transferInfo2.status, 1);
    });
  });

  describe("Test batchCancelTransfer function", function () {
    it("should fail if sender is not the same as origin for transfer", async function () {
      const { entity2, transferHash, qiu } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await expect(
        qiu.connect(entity2).batchCancelTransfer([transferHash])
      ).to.be.revertedWith("Not authorized");
    });
    it("should fail if origin tries to batchCancelTransfer before it expires", async function () {
      const { entity1, transferHash, qiu } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await expect(
        qiu.connect(entity1).batchCancelTransfer([transferHash])
      ).to.be.revertedWith("transfer not expired");
    });
    it("should fail if transfer is not status pending", async function () {
      const { entity1, entity2, transferHash, qiu, expiryTime } =
        await loadFixture(deployFixtureAndTransferRequest);

      await qiu.connect(entity2).batchAcceptTransfer([transferHash]);
      await time.increaseTo(expiryTime);

      await expect(
        qiu.connect(entity1).batchCancelTransfer([transferHash])
      ).to.be.revertedWith("transfer already completed or cancelled");
    });
    it("origin should be able to batchCancelTransfer after it expires", async function () {
      const { entity1, ent1, transferHash, qiu, expiryTime, tERC20 } =
        await loadFixture(deployFixtureAndTransferRequest);

      await time.increaseTo(expiryTime);

      await expect(qiu.connect(entity1).batchCancelTransfer([transferHash]))
        .to.emit(qiu, "TransferCancelled")
        .withArgs(transferHash, ent1.address);

      assert.equal(await tERC20.balanceOf(qiu.address), 0);
      const transferInfo = await qiu.transfers(transferHash);
      assert.equal(transferInfo.status, 2);
    });
    it("should batch cancel many transfers after it expires", async function () {
      const {
        entity1,
        transferHash,
        qiu,
        tERC20,
        tokenAmount,
        originDomain,
        destinationDomain,
      } = await loadFixture(deployFixtureAndTransferRequest);

      const transferHashes = await batchTransferRequest(
        tERC20,
        qiu,
        [entity1],
        [originDomain],
        [destinationDomain],
        [tokenAmount],
        ["0x"],
        ["0x"],
        [ONE_WEEK_IN_SECS],
        ["0x"]
      );

      const transferHash2 = transferHashes[0];

      const transferInfo2before = await qiu.transfers(transferHash2);
      await time.increaseTo(bn(transferInfo2before.expiration).add(1));

      await qiu
        .connect(entity1)
        .batchCancelTransfer([transferHash, transferHash2]);

      assert.equal(await tERC20.balanceOf(qiu.address), 0);
      const transferInfo1 = await qiu.transfers(transferHash);
      const transferInfo2 = await qiu.transfers(transferHash);
      assert.equal(transferInfo1.status, 2);
      assert.equal(transferInfo2.status, 2);
    });
  });

  describe("e2e - Transfer and accept using encryptation", function () {
    it("Should use alias for transfers", async function () {
      const { owner, ent1, ent2, entity1, entity2, tERC20, qiu } =
        await loadFixture(deployFixture);

      // register origin and destination
      const originDomain = "entity1.cvu";
      const pubKey = "0x" + ent1.publicKey;
      await qiu
        .connect(owner)
        .registerEntity(originDomain, ent1.address, pubKey);

      const destinationDomain = "entity2.cvu";
      const pubKey2 = "0x" + ent2.publicKey;
      await qiu
        .connect(owner)
        .registerEntity(destinationDomain, ent2.address, pubKey2);

      const userOrigin = "user_alias_ori";
      const userDest = "user_alias_dest";
      const tokenAmount = "1";

      const encryptedOrigin =
        "0x" + (await encrypt(ent2.publicKey, userOrigin));
      const encryptedDestination =
        "0x" + (await encrypt(ent2.publicKey, userDest));

      const expiryTime = (await time.latest()) + ONE_WEEK_IN_SECS + 1;
      const externalReference = "0x";

      const transferHashes = await batchTransferRequest(
        tERC20,
        qiu,
        [entity1],
        [originDomain],
        [destinationDomain],
        [tokenAmount],
        [encryptedOrigin],
        [encryptedDestination],
        [expiryTime],
        [externalReference]
      );

      const transferHash = transferHashes[0];
      const balanceBefore = await tERC20.balanceOf(entity2.address);
      await qiu.connect(entity2).batchAcceptTransfer([transferHash]);

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
  describe("Test pausable", function () {
    it("Revert - test paused", async function () {
      // test pausable
      const { owner, qiu } = await loadFixture(deployFixture);
      await qiu.connect(owner).pause();
      await expect(qiu.connect(owner).pause()).to.be.revertedWith(
        "Pausable: paused"
      );
    });
    // test whenNotPaused
    it("Revert - test whenNotPaused", async function () {
      const { owner, qiu } = await loadFixture(deployFixture);
      await qiu.connect(owner).pause();
      await expect(
        qiu.connect(owner).registerEntity("test", owner.address, "0x")
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Test pause and unpause events", async function () {
      const { owner, qiu } = await loadFixture(deployFixture);
      //assert event
      await expect(qiu.connect(owner).pause())
        .to.emit(qiu, "Paused")
        .withArgs(owner.address);

      //assert event
      await expect(qiu.connect(owner).unpause())
        .to.emit(qiu, "Unpaused")
        .withArgs(owner.address);

      await qiu.connect(owner).registerEntity("test", owner.address, "0x");
    });
  });
});
