# LCS flow example (network: LAchain)

### Deployed Contracts

Example:

```
ERC20: 0x903CA313eB4944663aC470Cf88152dF1f27ffc0f
LocalCoinSettlementV2: 0x9546bB1A1aF05717819E4bCb756EA95D5C9D17A4
```

## Setup env vars

```
LACHAIN_TESTNET_RPC_URL=https://rpc.testnet.lachain.network
PRIVATE_KEY=dfba...
```

The PRIVATE_KEY env has to be set to the sender of the transaction.

## Step 1 - Register new entities

### Create entity keys (if necessary)

```
npx hardhat create-new-entity-keys
```

Example response:
{
privateKey: '0x7e...',
publicKey: '86f221f4a7288cd3f9cc7badc08ec10222928b22a947c64758b7e255289f437d76a4dcecde2ad50892ccb3c6ec03d7aebfcf560754cd6545ea232218a22e5036',
address: '0xB9476fa0c25367b24506cDc50FB62CadD2392DD7'
}

## Register entity 1 (sender: admin)

Example entity data : {
entityId: 00001478
privateKey: '0xcf7...',
publicKey: '50e2459c79c543438f524926dae44dcba2dc18c554ff98c59c903abdc19f55314b99d2161634ae09179ac7cd59a420283357ba335134d8a24f6bee7c126ea85e',
address: '0x91D13B797e6aA9a4A4F63b05851ADE4Cd02CB765'
}

```
npx hardhat --network lachain register-entity --contract-address 0x9546bB1A1aF05717819E4bCb756EA95D5C9D17A4 --entity-address 0x91D13B797e6aA9a4A4F63b05851ADE4Cd02CB765 --entity-id "00001478" --public-key 0x50e2459c79c543438f524926dae44dcba2dc18c554ff98c59c903abdc19f55314b99d2161634ae09179ac7cd59a420283357ba335134d8a24f6bee7c126ea85e
```

## Register entity 2 (sender: admin)

Example entity data : {
entityId: 00001500
privateKey: '0x93b...',
publicKey: '118dc411e6d12546c8e062dee241208b06a2d1e60424e12befe78a5740f395fac3d48bf40c2876192dad7f5f57c58cffc69516262fee7287b6249e0edb80f605',
address: '0xF88E310B740f700Ac8f06cc1e57a28297eD62C3D'
}

```
npx hardhat --network lachain register-entity --contract-address 0x9546bB1A1aF05717819E4bCb756EA95D5C9D17A4 --entity-address 0xF88E310B740f700Ac8f06cc1e57a28297eD62C3D --entity-id "00001500" --public-key 0x118dc411e6d12546c8e062dee241208b06a2d1e60424e12befe78a5740f395fac3d48bf40c2876192dad7f5f57c58cffc69516262fee7287b6249e0edb80f605
```

## Set up entities

### Transfer native currency to entities (sender: admin)

```
npx hardhat --network lachain native-transfer --to 0x91D13B797e6aA9a4A4F63b05851ADE4Cd02CB765 --amount 1
```

```
npx hardhat --network lachain native-transfer --to 0xF88E310B740f700Ac8f06cc1e57a28297eD62C3D --amount 1

```

### Transfer tokens to entities (sender: admin)

```
npx hardhat --network lachain erc20-transfer --erc20-address 0x903CA313eB4944663aC470Cf88152dF1f27ffc0f --to 0x91D13B797e6aA9a4A4F63b05851ADE4Cd02CB765 --amount 100
```

```
npx hardhat --network lachain erc20-transfer --erc20-address 0x903CA313eB4944663aC470Cf88152dF1f27ffc0f --to 0xF88E310B740f700Ac8f06cc1e57a28297eD62C3D --amount 100
```

## Step 2 - transfer Request (sender: entity 1)

exampleCVUOrigin = "0000147800036521571806";
exampleCVUDestination = "0000150000036521572030";

how to encrypt cvu in helper section.

### Approve tokens to lcs contract (sender: entity 1)

```
npx hardhat --network lachain erc20-approve --erc20-address 0x903CA313eB4944663aC470Cf88152dF1f27ffc0f --spender 0x9546bB1A1aF05717819E4bCb756EA95D5C9D17A4 --amount 100
```

### send transfer Request (sender: entity 1)

```
npx hardhat --network lachain transfer-request --contract-address 0x9546bB1A1aF05717819E4bCb756EA95D5C9D17A4 --destination 0xF88E310B740f700Ac8f06cc1e57a28297eD62C3D --amount 1 --encrypted-cvu-origin 0xd2f1037735a3544fc40eeb8f0aa5457703632030f868014eb168d6b9b78f75dc9f196f0ee6bd32f8812525715a3e7ba4656ff3de110c34440e7726be87d99b46dcc31f11df5fa622bc04ae6ffc6342721c8a4a86531d82d21cad23ecddcec7ca68881b5542f0440df155ff07a25a186a67 --encrypted-cvu-destination 0x87875cb7fbd76973514bef4268190e1702fe5db3f39994bb28c5d26e9edde07283f8142e9794a630e99fe01481d075688f7a0b7d012b7e4594e587cab16d72fbf83b5557f1907fcb41d62eb71fa27f6ed446513f3e516e42a83adf51de7cda61b3d0404810379df2c6a6334fc3c7ea2f34 --expiration 100000
```

transferHash: 0xbff70361bc6c6c74450bb5a6749299a19526c4bdb58d4ffd231a60bc0fda77bc

## Step 3 - Batch accept Transfers (sender: entity 2)

```
npx hardhat --network lachain batch-accept-transfers --contract-address 0x9546bB1A1aF05717819E4bCb756EA95D5C9D17A4 0xbff70361bc6c6c74450bb5a6749299a19526c4bdb58d4ffd231a60bc0fda77bc
```

## Helpers

### encrypt cvu

exampleCVUOrigin = "0000147800036521571806";
exampleCVUDestination = "0000150000036521572030";

Encrypt cvu 1:

```
npx hardhat encrypt-cvu --cvu "0000147800036521571806" --public-key 50e2459c79c543438f524926dae44dcba2dc18c554ff98c59c903abdc19f55314b99d2161634ae09179ac7cd59a420283357ba335134d8a24f6bee7c126ea85e
```

encryptedCvu: d2f1037735a3544fc40eeb8f0aa5457703632030f868014eb168d6b9b78f75dc9f196f0ee6bd32f8812525715a3e7ba4656ff3de110c34440e7726be87d99b46dcc31f11df5fa622bc04ae6ffc6342721c8a4a86531d82d21cad23ecddcec7ca68881b5542f0440df155ff07a25a186a67

Decrypt cvu:

```
npx hardhat decrypt-cvu --encrypted-cvu d2f1037735a3544fc40eeb8f0aa5457703632030f868014eb168d6b9b78f75dc9f196f0ee6bd32f8812525715a3e7ba4656ff3de110c34440e7726be87d99b46dcc31f11df5fa622bc04ae6ffc6342721c8a4a86531d82d21cad23ecddcec7ca68881b5542f0440df155ff07a25a186a67 --private-key 0xcf..
```

Encrypt cvu 2:

```
npx hardhat encrypt-cvu --cvu "0000150000036521572030" --public-key 118dc411e6d12546c8e062dee241208b06a2d1e60424e12befe78a5740f395fac3d48bf40c2876192dad7f5f57c58cffc69516262fee7287b6249e0edb80f605
```

encryptedCvu: 87875cb7fbd76973514bef4268190e1702fe5db3f39994bb28c5d26e9edde07283f8142e9794a630e99fe01481d075688f7a0b7d012b7e4594e587cab16d72fbf83b5557f1907fcb41d62eb71fa27f6ed446513f3e516e42a83adf51de7cda61b3d0404810379df2c6a6334fc3c7ea2f34

### check balance erc20 tokens

```
npx hardhat --network lachain erc20-balance --erc20-address 0x903CA313eB4944663aC470Cf88152dF1f27ffc0f --address <account_address>
```

### check native balance

```
npx hardhat --network lachain native-balance --address <account_address>
```
