const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const EthCrypto = require("eth-crypto");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

function bn(x) {
  return ethers.BigNumber.from(x);
}

describe("Test LocalCoinSettlement", function () {
  async function deployFixture() {
    [owner] = await hre.ethers.getSigners();

    ent1 = EthCrypto.createIdentity();
    ent2 = EthCrypto.createIdentity();
    ent3 = EthCrypto.createIdentity();
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

    const LocalCoinSettlement = await hre.ethers.getContractFactory(
      "LocalCoinSettlement"
    );
    const lcs = await LocalCoinSettlement.connect(owner).deploy(tERC20.address);
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
  describe("Test Registry", function () {
    it("Register a new entity", async function () {
      const { owner, ent1, lcs } = await loadFixture(deployFixture);

      const providerId = "00000031";
      const pubKey = "0x" + ent1.publicKey;
      await expect(
        lcs.connect(owner).registerEntity(ent1.address, providerId, pubKey)
      )
        .to.emit(lcs, "NewEntity")
        .withArgs(ent1.address, bn(providerId), pubKey);

      const entity = await lcs.entities(ent1.address);
      assert.equal(entity.entityId, providerId);
      assert.equal(entity.nonce, 0);
      assert.equal(entity.publicKey, pubKey);
      assert.equal(entity.publicKey.substr(2), ent1.publicKey);
    });

    it("revert - Only owner can register a new entity", async function () {
      const { ent1, entity2, lcs } = await loadFixture(deployFixture);

      const providerId = "00000031";
      const pubKey = "0x" + ent1.publicKey;

      await expect(
        lcs.connect(entity2).registerEntity(ent1.address, providerId, pubKey)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Transfer tokens", function () {
    it("Revert - Origin entity not register", async function () {
      const { entity1, ent1, ent2, lcs } = await loadFixture(deployFixture);

      await expect(
        lcs.connect(entity1).transfer(ent2.address, "1", "0x", "0x")
      ).to.be.revertedWith("origin not register");
    });

    it("Revert - Destination entity not register", async function () {
      const { owner, entity1, ent1, ent2, lcs } = await loadFixture(
        deployFixture
      );

      const providerId = "00000031";
      const pubKey = "0x" + ent1.publicKey;
      await lcs.connect(owner).registerEntity(ent1.address, providerId, pubKey);

      await expect(
        lcs.connect(entity1).transfer(ent2.address, "1", "0x", "0x")
      ).to.be.revertedWith("destination not register");
    });

    it("Revert - Not enought allowance to transfer", async function () {
      const { owner, entity1, ent1, ent2, lcs } = await loadFixture(
        deployFixture
      );

      // register origin and destination
      const providerId = "00000031";
      const pubKey = "0x" + ent1.publicKey;
      await lcs.connect(owner).registerEntity(ent1.address, providerId, pubKey);

      const providerId2 = "00001478";
      const pubKey2 = "0x" + ent2.publicKey;
      await lcs
        .connect(owner)
        .registerEntity(ent2.address, providerId2, pubKey2);

      await expect(
        lcs.connect(entity1).transfer(ent2.address, "1", "0x", "0x")
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("should transfer tokens from ent1 to ent2", async function () {
      const { owner, entity1, ent1, ent2, lcs, tERC20 } = await loadFixture(
        deployFixture
      );

      // register origin and destination
      const providerId = "00000031";
      const pubKey = "0x" + ent1.publicKey;
      await lcs.connect(owner).registerEntity(ent1.address, providerId, pubKey);

      const providerId2 = "00001478";
      const pubKey2 = "0x" + ent2.publicKey;
      await lcs
        .connect(owner)
        .registerEntity(ent2.address, providerId2, pubKey2);

      const tokenAmount = "1";
      const encrtyptedCvuOrigin = "0x";
      const encrtyptedCvuDestination = "0x";
      // approve tokens
      await tERC20.connect(entity1).approve(lcs.address, tokenAmount);

      const entity1Info = await lcs.entities(ent1.address);

      await expect(
        lcs
          .connect(entity1)
          .transfer(
            ent2.address,
            tokenAmount,
            encrtyptedCvuOrigin,
            encrtyptedCvuDestination
          )
      )
        .to.emit(lcs, "LogTransfer")
        .withArgs(
          ent1.address,
          ent2.address,
          tokenAmount,
          encrtyptedCvuOrigin,
          encrtyptedCvuDestination,
          entity1Info.nonce
        );

      const entity1InfoAfter = await lcs.entities(ent1.address);
      assert.equal(entity1InfoAfter.nonce, 1);
    });

    it("should transfer tokens from ent1 to ent2 with encryted cvu origin and destination", async function () {
      const { owner, entity1, ent1, ent2, lcs, tERC20 } = await loadFixture(
        deployFixture
      );

      // register origin and destination
      const providerId = "00000031";
      const pubKey = "0x" + ent1.publicKey;
      await lcs.connect(owner).registerEntity(ent1.address, providerId, pubKey);

      const providerId2 = "00001478";
      const pubKey2 = "0x" + ent2.publicKey;
      await lcs
        .connect(owner)
        .registerEntity(ent2.address, providerId2, pubKey2);

      const tokenAmount = "1";
      const cvuOrigin = "0000003100036521571806";
      const cvuDestination = "0000147800036521571806";

      const encrtyptedCvuOrigin = await EthCrypto.encryptWithPublicKey(
        ent2.publicKey,
        cvuOrigin
      );
      const encrtyptedCvuDestination = await EthCrypto.encryptWithPublicKey(
        ent2.publicKey,
        cvuDestination
      );

      const encrtyptedCvuOriginStr =
        "0x" + EthCrypto.cipher.stringify(encrtyptedCvuOrigin);
      const encrtyptedCvuDestinationStr =
        "0x" + EthCrypto.cipher.stringify(encrtyptedCvuDestination);

      // approve tokens
      await tERC20.connect(entity1).approve(lcs.address, tokenAmount);
      const entity1Info = await lcs.entities(ent1.address);

      await expect(
        lcs
          .connect(entity1)
          .transfer(
            ent2.address,
            tokenAmount,
            encrtyptedCvuOriginStr,
            encrtyptedCvuDestinationStr
          )
      )
        .to.emit(lcs, "LogTransfer")
        .withArgs(
          ent1.address,
          ent2.address,
          tokenAmount,
          encrtyptedCvuOriginStr,
          encrtyptedCvuDestinationStr,
          entity1Info.nonce
        );

      const entity1InfoAfter = await lcs.entities(ent1.address);
      assert.equal(entity1InfoAfter.nonce, 1);

      const eCvuOrigin = EthCrypto.cipher.parse(
        encrtyptedCvuOriginStr.substr(2)
      );
      const eCvuDestination = EthCrypto.cipher.parse(
        encrtyptedCvuDestinationStr.substr(2)
      );

      const cvuOri = await EthCrypto.decryptWithPrivateKey(
        ent2.privateKey,
        eCvuOrigin
      );
      const cvuDest = await EthCrypto.decryptWithPrivateKey(
        ent2.privateKey,
        eCvuDestination
      );

      assert.equal(cvuOrigin, cvuOri);
      assert.equal(cvuDestination, cvuDest);
    });
  });
});
