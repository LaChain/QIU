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

// Ripio        00001478
// Belo	        00001393
// Bitso	    00000253
// Mercado Pago	00000031
// Ualá	        00000079

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
    destinationAddress,
    tokenAmount,
    encryptedOrigin,
    encryptedDestination,
    expirationTime
  ) {
    // approve tokens
    await tERC20.connect(entityOrigin).approve(lcs.address, tokenAmount);
    const entityInfo = await lcs.entities(entityOrigin.address);

    const transferHash = ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "bytes", "bytes", "uint224", "uint256"],
      [
        entityOrigin.address,
        destinationAddress,
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
        destinationAddress,
        tokenAmount,
        encryptedOrigin,
        encryptedDestination,
        expirationTime
      );

    return transferHash;
  }

  async function deployFixtureAndTransferRequest() {
    const { owner, ent1, ent2, ent3, entity1, entity2, entity3, tERC20, lcs } =
      await deployFixture();

    // register origin and destination
    const providerId = "00000031";
    const domain1 = "@entity1";
    const pubKey = "0x" + ent1.publicKey;
    await lcs
      .connect(owner)
      .registerEntity(ent1.address, providerId, domain1, pubKey);

    const providerId2 = "00001478";
    const domain2 = "@entity2";
    const pubKey2 = "0x" + ent2.publicKey;
    await lcs
      .connect(owner)
      .registerEntity(ent2.address, providerId2, domain2, pubKey2);

    const tokenAmount = "1";
    const encryptedOrigin = "0x";
    const encryptedDestination = "0x";
    const expiryTime = (await time.latest()) + ONE_WEEK_IN_SECS + 1;
    // approve tokens
    await tERC20.connect(entity1).approve(lcs.address, tokenAmount);

    const entity1Info = await lcs.entities(ent1.address);
    const transferHash = ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "bytes", "bytes", "uint224", "uint256"],
      [
        ent1.address,
        ent2.address,
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
          ent2.address,
          tokenAmount,
          encryptedOrigin,
          encryptedDestination,
          ONE_WEEK_IN_SECS
        )
    )
      .to.emit(lcs, "NewTransferRequest")
      .withArgs(
        transferHash,
        ent1.address,
        ent2.address,
        tokenAmount,
        encryptedOrigin,
        encryptedDestination,
        entity1Info.nonce,
        ONE_WEEK_IN_SECS
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
      tokenAmount,
      encryptedOrigin,
      encryptedDestination,
      transferHash,
      entity1Info,
      expiryTime,
    };
  }

  const ONE_WEEK_IN_SECS = 7 * 24 * 60 * 60;

  describe("Test register entity", function () {
    it("Revert - Only Owner can register a new entity", async function () {
      const { entity1, lcs, ent1 } = await loadFixture(deployFixture);

      const providerId = "00000031";
      const domain1 = "@entity1";
      const pubKey = "0x" + ent1.publicKey;

      await expect(
        lcs
          .connect(entity1)
          .registerEntity(ent1.address, providerId, domain1, pubKey)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("Should register a new entity", async function () {
      const { owner, ent1, lcs } = await loadFixture(deployFixture);

      const providerId = "00000031";
      const domain1 = "@entity1";
      const pubKey = "0x" + ent1.publicKey;

      await expect(
        lcs
          .connect(owner)
          .registerEntity(ent1.address, providerId, domain1, pubKey)
      )
        .to.emit(lcs, "EntityUpdated")
        .withArgs(ent1.address, bn(providerId), domain1, pubKey);
    });
    it("Revert - Only Owner can modify data of an existing entity", async function () {
      const { entity1, lcs, ent1 } = await loadFixture(deployFixture);

      const providerId = "00000031";
      const domain1 = "@entity1";
      const pubKey = "0x" + ent1.publicKey;

      await expect(
        lcs
          .connect(entity1)
          .modifyEntity(ent1.address, providerId, domain1, pubKey)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("Should modify data of an existing entity", async function () {
      const { owner, ent1, lcs } = await loadFixture(deployFixture);

      const providerId = "00000031";
      const domain1 = "@entity1";
      const pubKey = "0x" + ent1.publicKey;

      await lcs
        .connect(owner)
        .registerEntity(ent1.address, providerId, domain1, pubKey);

      const updatedDomain = "@updatedDomain";

      await expect(
        lcs
          .connect(owner)
          .modifyEntity(ent1.address, providerId, updatedDomain, pubKey)
      )
        .to.emit(lcs, "EntityUpdated")
        .withArgs(ent1.address, bn(providerId), updatedDomain, pubKey);
    });
  });

  describe("Test new transfer request", function () {
    it("Revert - Origin entity not register", async function () {
      const { entity1, ent2, lcs } = await loadFixture(deployFixture);

      await expect(
        lcs
          .connect(entity1)
          .transferRequest(ent2.address, "1", "0x", "0x", ONE_WEEK_IN_SECS)
      ).to.be.revertedWith("origin entity not registered");
    });

    it("Revert - Destination entity not register", async function () {
      const { owner, entity1, ent1, ent2, lcs } = await loadFixture(
        deployFixture
      );

      const providerId = "00000031";
      const domain = "@entity1";
      const pubKey = "0x" + ent1.publicKey;
      await lcs
        .connect(owner)
        .registerEntity(ent1.address, providerId, domain, pubKey);

      await expect(
        lcs
          .connect(entity1)
          .transferRequest(ent2.address, "1", "0x", "0x", ONE_WEEK_IN_SECS)
      ).to.be.revertedWith("destination entity not registered");
    });

    it("Revert - Not enought allowance to transfer", async function () {
      const { owner, entity1, ent1, ent2, lcs } = await loadFixture(
        deployFixture
      );

      // register origin and destination
      const providerId = "00000031";
      const domain1 = "@entity1";
      const pubKey = "0x" + ent1.publicKey;
      await lcs
        .connect(owner)
        .registerEntity(ent1.address, providerId, domain1, pubKey);

      const providerId2 = "00001478";
      const domain2 = "@entity2";
      const pubKey2 = "0x" + ent2.publicKey;
      await lcs
        .connect(owner)
        .registerEntity(ent2.address, providerId2, domain2, pubKey2);

      await expect(
        lcs
          .connect(entity1)
          .transferRequest(ent2.address, "1", "0x", "0x", ONE_WEEK_IN_SECS)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
    it("should transfer tokens from ent1 to contract and emit transferRequest event", async function () {
      const { ent1, lcs, tERC20, tokenAmount, transferHash } =
        await loadFixture(deployFixtureAndTransferRequest);

      const entity1InfoAfter = await lcs.entities(ent1.address);
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
      ).to.be.revertedWith("not authorized");
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
      const { entity1, entity2, ent2, transferHash, lcs, tERC20, tokenAmount } =
        await loadFixture(deployFixtureAndTransferRequest);

      const balanceBefore = await tERC20.balanceOf(ent2.address);

      const transferHash2 = await newTransferRequest(
        tERC20,
        lcs,
        entity1,
        ent2.address,
        tokenAmount,
        "0x",
        "0x",
        ONE_WEEK_IN_SECS
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
      ).to.be.revertedWith("not authorized");
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
      const { entity1, transferHash, lcs, expiryTime, tERC20, tokenAmount } =
        await loadFixture(deployFixtureAndTransferRequest);

      const transferHash2 = await newTransferRequest(
        tERC20,
        lcs,
        entity1,
        ent2.address,
        tokenAmount,
        "0x",
        "0x",
        ONE_WEEK_IN_SECS
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

  describe("e2e - Transfer using alias", function () {
    it("Should use alias for transfers", async function () {
      const { owner, ent1, ent2, entity1, entity2, tERC20, lcs } =
        await loadFixture(deployFixture);

      // register origin and destination
      const providerId = "00000031";
      const domain1 = "@mercadopago";
      const pubKey1 = "0x" + ent1.publicKey;
      await lcs
        .connect(owner)
        .registerEntity(ent1.address, providerId, domain1, pubKey1);

      const providerId2 = "00001478";
      const domain2 = "@ripio";
      const pubKey2 = "0x" + ent2.publicKey;
      await lcs
        .connect(owner)
        .registerEntity(ent2.address, providerId2, domain2, pubKey2);

      const origin = "user_alias_ori@mercadopago";
      const destination = "user_alias_dest@ripio";
      const tokenAmount = "1";

      const encryptedOrigin = "0x" + (await encrypt(ent2.publicKey, origin));
      const encryptedDestination =
        "0x" + (await encrypt(ent2.publicKey, destination));

      const expiryTime = (await time.latest()) + ONE_WEEK_IN_SECS + 1;

      const transferHash = await newTransferRequest(
        tERC20,
        lcs,
        entity1,
        entity2.address,
        tokenAmount,
        encryptedOrigin,
        encryptedDestination,
        expiryTime
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
      assert.equal(decryptOrigin, origin);
      assert.equal(decryptDestination, destination);
    });
  });
});
