# LCS flow example (network: LAchain)

### Deployed Contracts

Example:

```
ERC20: 0x6f69b28c7461d80a17f1ec263ab3dfb3a69ee354
LocalCoinSettlementV2: 0x8992e0b2fA5E867962c9c02b622C4F601c57c02A
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
privateKey: '0xd84..',
publicKey: '56e67a981b41f64c587bb9750ca5d6cd12f240c6f6ba2439277f882843d5054629efaefbf549e99e5e2768f6acfb458c92dd6abfe8ceccf1418a2caca3dea607',
address: '0xA4C0c9e95ef693464383b9CF4E405d9a3E7aE825'
}

```
npx hardhat --network lachain register-entity --contract-address 0x8992e0b2fA5E867962c9c02b622C4F601c57c02A --entity-address 0xA4C0c9e95ef693464383b9CF4E405d9a3E7aE825 --entity-id "00001478" --public-key 0x56e67a981b41f64c587bb9750ca5d6cd12f240c6f6ba2439277f882843d5054629efaefbf549e99e5e2768f6acfb458c92dd6abfe8ceccf1418a2caca3dea607
```

## Register entity 2 (sender: admin)

Example entity data : {
entityId: 00000031
privateKey: '0xe42..',
publicKey: 'cc95c03effdb2486c2f59878125840bfce43324452c8ae63a992adeb77b7c9049c81e96b7dc23df9d291c776f9aee699e6655785a593aa3958ed677b0b91c120',
address: '0x39f76952100495698C5a9a0441DcD14fBB814bE3'
}

```
npx hardhat --network lachain register-entity --contract-address 0x8992e0b2fA5E867962c9c02b622C4F601c57c02A --entity-address 0x39f76952100495698C5a9a0441DcD14fBB814bE3 --entity-id "00000031" --public-key 0xcc95c03effdb2486c2f59878125840bfce43324452c8ae63a992adeb77b7c9049c81e96b7dc23df9d291c776f9aee699e6655785a593aa3958ed677b0b91c120
```

## Set up entities

### Transfer native currency to entities (sender: admin)

```
npx hardhat --network lachain native-transfer --to 0xA4C0c9e95ef693464383b9CF4E405d9a3E7aE825 --amount 0.01
```

```
npx hardhat --network lachain native-transfer --to 0x39f76952100495698C5a9a0441DcD14fBB814bE3 --amount 0.01

```

### Transfer tokens to entities (sender: admin)

```
npx hardhat --network lachain erc20-transfer --erc20-address 0x6f69b28c7461d80a17f1ec263ab3dfb3a69ee354 --to 0xA4C0c9e95ef693464383b9CF4E405d9a3E7aE825 --amount 100
```

```
npx hardhat --network lachain erc20-transfer --erc20-address 0x6f69b28c7461d80a17f1ec263ab3dfb3a69ee354 --to 0x39f76952100495698C5a9a0441DcD14fBB814bE3 --amount 100
```

## Step 2 - transfer Request (sender: entity 1)

exampleOrigin = "0000147800036521571806";
exampleDestination = "0000003100036521572030";

how to encrypt data in helper section.

### Approve tokens to lcs contract (sender: entity 1)

```
npx hardhat --network lachain erc20-approve --erc20-address 0x6f69b28c7461d80a17f1ec263ab3dfb3a69ee354 --spender 0x8992e0b2fA5E867962c9c02b622C4F601c57c02A --amount 100
```

### send transfer Request (sender: entity 1)

```
npx hardhat --network lachain transfer-request --contract-address 0x8992e0b2fA5E867962c9c02b622C4F601c57c02A --destination 0x39f76952100495698C5a9a0441DcD14fBB814bE3 --amount 1 --encrypted-origin 0x49650535bc6cc216b3ff1dd77e63b30b02286ceb03999ebe4d0c0bdd5f649c54cffd95dec287adc8342954930c52c3e7bccd3b255fb161d2a612bd61a54cd4e13ab50252522bd1b5157c50ce0745ed2589c286ccbcfc8c93027e635477edb1d697194770e022bd8f9f754386d5706c09fe --encrypted-destination 0xb5c70f5ecd02213dab98fb4e6763b6a003835dc0e3f9f39f74da74a7a1e23e6dffb610323bbfd3b923b2c18a0ec9d82f498eaa0238597ed3aaeb320e464decf6b9af87582c54d415fe57f6407f7794ede9b5062daea4c6e4ea6dc581834ba183bc281e6252db36f4adfa41c96f351ac73c --expiration 100000
```

transferHash: 0x449de24bbe3236353b131865d29db1861f4d16b79893ce6007eafee0e0196dfa

## Step 3 - Batch accept Transfers (sender: entity 2)

```
npx hardhat --network lachain batch-accept-transfers --contract-address 0x8992e0b2fA5E867962c9c02b622C4F601c57c02A 0x449de24bbe3236353b131865d29db1861f4d16b79893ce6007eafee0e0196dfa
```

## Helpers

### encrypt data

exampleOrigin = "0000147800036521571806";
exampleDestination = "0000003100036521572030";

Encrypt data exampleOrigin:

```
npx hardhat encrypt --data "0000147800036521571806" --public-key cc95c03effdb2486c2f59878125840bfce43324452c8ae63a992adeb77b7c9049c81e96b7dc23df9d291c776f9aee699e6655785a593aa3958ed677b0b91c120
```

encryptedData: 49650535bc6cc216b3ff1dd77e63b30b02286ceb03999ebe4d0c0bdd5f649c54cffd95dec287adc8342954930c52c3e7bccd3b255fb161d2a612bd61a54cd4e13ab50252522bd1b5157c50ce0745ed2589c286ccbcfc8c93027e635477edb1d697194770e022bd8f9f754386d5706c09fe

Decrypt data:

```
npx hardhat decrypt --encrypted-data 49650535bc6cc216b3ff1dd77e63b30b02286ceb03999ebe4d0c0bdd5f649c54cffd95dec287adc8342954930c52c3e7bccd3b255fb161d2a612bd61a54cd4e13ab50252522bd1b5157c50ce0745ed2589c286ccbcfc8c93027e635477edb1d697194770e022bd8f9f754386d5706c09fe --private-key 0xe426f7181706b10f86eb32656443fdfa6f6c7b2d9c09286c07421a24b58e2075
```

Encrypt data exampleDestination:

```
npx hardhat encrypt --data "0000003100036521572030" --public-key cc95c03effdb2486c2f59878125840bfce43324452c8ae63a992adeb77b7c9049c81e96b7dc23df9d291c776f9aee699e6655785a593aa3958ed677b0b91c120
```

encryptedCvu: b5c70f5ecd02213dab98fb4e6763b6a003835dc0e3f9f39f74da74a7a1e23e6dffb610323bbfd3b923b2c18a0ec9d82f498eaa0238597ed3aaeb320e464decf6b9af87582c54d415fe57f6407f7794ede9b5062daea4c6e4ea6dc581834ba183bc281e6252db36f4adfa41c96f351ac73c

### check balance erc20 tokens

```
npx hardhat --network lachain erc20-balance --erc20-address 0x903CA313eB4944663aC470Cf88152dF1f27ffc0f --address <account_address>
```

### check native balance

```
npx hardhat --network lachain native-balance --address <account_address>
```
