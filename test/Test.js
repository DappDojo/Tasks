const {
  time,
  loadFixture
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { PANIC_CODES } = require("@nomicfoundation/hardhat-chai-matchers/panic");

const ZERO = ethers.parseEther('0');
const ONE_ETHER = ethers.parseEther('1');
const TWO_ETHER = ethers.parseEther('2');

const PASSWORD = "0x0000000000000000000000000000000000000000000000000000000000000010";


describe("Test", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function initialize() {
    // Contracts are deployed using the first signer/account by default
    const [owner, attacker] = await ethers.getSigners();

    const Storage = await ethers.getContractFactory("Storage");
    const storage = await Storage.deploy();

    const Wallet = await ethers.getContractFactory("Wallet");
    const wallet = await Wallet.deploy();

    const WalletAttack = await ethers.getContractFactory("WalletAttack");
    const walletAttack = await WalletAttack.connect(attacker).deploy(wallet.target);


    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(PASSWORD);

    return { storage, wallet, vault, walletAttack, owner, attacker };
  }

  describe("Storage", function () {
    it("Should not be reverted with value 18", async () => {
      const { storage } = await loadFixture(initialize);
      await expect(storage.scale(18)).not.to.be.reverted;
    });

    it("Should be reverted with value 19", async () => {
      const { storage } = await loadFixture(initialize);
      await expect(storage.scale(19))
        .to.be.revertedWithPanic(
          PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW
        );
    });

    it("Should be fixed with explicit conversion (uint256(a))", async () => {
      const { storage } = await loadFixture(initialize);
      await expect(storage.scaleFixed(19)).not.to.be.reverted;
    });
  });

  describe("Walllet", function () {
    it("Should allow the reentrancy attack", async () => {
      const { wallet, walletAttack, owner, attacker } = await loadFixture(initialize);
      // Contract owner deposit one ether. 
      await expect(
        wallet.deposit(owner.address, {value: ONE_ETHER})
      ).not.to.be.reverted;

      expect(
        await wallet.balanceOf(owner.address)
      ).to.be.equal(ONE_ETHER);

      expect(
        await ethers.provider.getBalance(wallet.target)
      ).to.be.equal(ONE_ETHER);

      // Attack: attacker deposits one ether and obtain two ether after attack.
      expect(
        await ethers.provider.getBalance(walletAttack.target)
      ).to.be.equal(ZERO);
      
      await expect(
         wallet.connect(attacker).deposit(walletAttack.target, {value: ONE_ETHER})
      ).not.to.be.reverted;

      expect(
        await ethers.provider.getBalance(wallet.target)
      ).to.be.equal(TWO_ETHER);

      await expect(
         walletAttack.connect(attacker).attack({value: ONE_ETHER})
      ).to.changeEtherBalance(walletAttack, TWO_ETHER);
      
      // Attack succeed!!
      expect(
        await ethers.provider.getBalance(walletAttack.target)
      ).to.be.equal(TWO_ETHER);

      // Transfer contract's balance to the attacker
      await expect(
         walletAttack.connect(attacker).withdraw()
      ).to.changeEtherBalance(attacker, TWO_ETHER);
    });
  });

  describe("Vault", function () {
    it("Should be able to read the private variable content", async () => {
      const { vault } = await loadFixture(initialize);

      const pass = await ethers.provider.getStorage(vault.target, 1);
      await vault.unlock(pass);
      expect(await vault.locked()).to.be.equal(false);
      
    });
  });

  
});
