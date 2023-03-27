const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const EthCrypto = require("eth-crypto");
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

  async function deployFixtureAndTransferRequest() {
    const { owner, ent1, ent2, ent3, entity1, entity2, entity3, tERC20, lcs } =
      await deployFixture();

    // register origin and destination
    const providerId = "00000031";
    const pubKey = "0x" + ent1.publicKey;
    await lcs.connect(owner).registerEntity(ent1.address, providerId, pubKey);

    const providerId2 = "00001478";
    const pubKey2 = "0x" + ent2.publicKey;
    await lcs.connect(owner).registerEntity(ent2.address, providerId2, pubKey2);

    const tokenAmount = "1";
    const encrtyptedCvuOrigin = "0x";
    const encrtyptedCvuDestination = "0x";
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
        encrtyptedCvuOrigin,
        encrtyptedCvuDestination,
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
          encrtyptedCvuOrigin,
          encrtyptedCvuDestination,
          ONE_WEEK_IN_SECS
        )
    )
      .to.emit(lcs, "NewTransferRequest")
      .withArgs(
        transferHash,
        ent1.address,
        ent2.address,
        tokenAmount,
        encrtyptedCvuOrigin,
        encrtyptedCvuDestination,
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
      encrtyptedCvuOrigin,
      encrtyptedCvuDestination,
      transferHash,
      entity1Info,
      expiryTime,
    };
  }

  const ONE_WEEK_IN_SECS = 7 * 24 * 60 * 60;

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
      const pubKey = "0x" + ent1.publicKey;
      await lcs.connect(owner).registerEntity(ent1.address, providerId, pubKey);

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
      const pubKey = "0x" + ent1.publicKey;
      await lcs.connect(owner).registerEntity(ent1.address, providerId, pubKey);

      const providerId2 = "00001478";
      const pubKey2 = "0x" + ent2.publicKey;
      await lcs
        .connect(owner)
        .registerEntity(ent2.address, providerId2, pubKey2);

      await expect(
        lcs
          .connect(entity1)
          .transferRequest(ent2.address, "1", "0x", "0x", ONE_WEEK_IN_SECS)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
    it("should transfer tokens from ent1 to contract and emit transferRequest event", async function () {
      const { ent1, lcs, tERC20, tokenAmount } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      const entity1InfoAfter = await lcs.entities(ent1.address);
      assert.equal(entity1InfoAfter.nonce, 1);
      assert.equal(await tERC20.balanceOf(lcs.address), tokenAmount);
    });
  });

  describe("Test withdraw function", function () {
    it("should fail if destination for transfer is not the same as msg.sender", async function () {
      const { entity1, transferHash, lcs } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await expect(
        lcs.connect(entity1).withdraw(transferHash)
      ).to.be.revertedWith("not authorized");
    });
    it("should fail if transfer request is expired", async function () {
      const { entity2, transferHash, lcs, expiryTime } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await time.increaseTo(expiryTime);

      await expect(
        lcs.connect(entity2).withdraw(transferHash)
      ).to.be.revertedWith("transfer expired");
    });
    it("should fail if transfer already completed is expired", async function () {
      const { entity2, transferHash, lcs } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await lcs.connect(entity2).withdraw(transferHash);

      await expect(
        lcs.connect(entity2).withdraw(transferHash)
      ).to.be.revertedWith("transfer already completed");
    });
    it("should withdraw transfer sucessfully and emit withdraw event", async function () {
      const { entity2, ent2, transferHash, lcs, tERC20, tokenAmount } =
        await loadFixture(deployFixtureAndTransferRequest);

      const balanceBefore = await tERC20.balanceOf(ent2.address);

      await expect(lcs.connect(entity2).withdraw(transferHash))
        .to.emit(lcs, "Withdraw")
        .withArgs(transferHash, ent2.address, true);

      const balanceAfter = await tERC20.balanceOf(ent2.address);
      expect(bn(balanceBefore).add(tokenAmount), balanceAfter).to.be.equal;
    });
  });

  describe("Test refund function", function () {
    it("should fail if sender is not the same as origin for transfer", async function () {
      const { entity2, transferHash, lcs } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await expect(
        lcs.connect(entity2).refund(transferHash)
      ).to.be.revertedWith("not authorized");
    });
    it("should fail if origin tries to get a refund before it expires", async function () {
      const { entity1, transferHash, lcs } = await loadFixture(
        deployFixtureAndTransferRequest
      );

      await expect(
        lcs.connect(entity1).refund(transferHash)
      ).to.be.revertedWith("transfer not expired");
    });
    it("should fail if transfer already completed", async function () {
      const { entity1, entity2, transferHash, lcs, expiryTime } =
        await loadFixture(deployFixtureAndTransferRequest);

      await lcs.connect(entity2).withdraw(transferHash);
      await time.increaseTo(expiryTime);

      await expect(
        lcs.connect(entity1).refund(transferHash)
      ).to.be.revertedWith("transfer already completed");
    });
    it("origin should be able to have a refund after it expires", async function () {
      const { entity1, ent1, transferHash, lcs, expiryTime, tERC20 } =
        await loadFixture(deployFixtureAndTransferRequest);

      await time.increaseTo(expiryTime);

      await expect(lcs.connect(entity1).refund(transferHash))
        .to.emit(lcs, "Refund")
        .withArgs(transferHash, ent1.address);

      assert.equal(await tERC20.balanceOf(lcs.address), 0);
    });
  });
});
