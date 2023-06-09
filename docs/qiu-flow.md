# Qiu flow example (network: LAchain)

### Deployed Contracts

Example:

```
ERC20: 0x8d6b9F2b28260Bb388424db3c2a92e2E0164Bd7c
Qiu: 0x6aD18D9D66933eF51D3bE117c425Ce355251f213
```

## Setup env vars

```
LACHAIN_TESTNET_RPC_URL=https://rpc.testnet.lachain.network
PRIVATE_KEYS=dfba...,0x7e...,0xe42..
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
domain: entity1.cvu
privateKey: '0xd84..',
publicKey: '56e67a981b41f64c587bb9750ca5d6cd12f240c6f6ba2439277f882843d5054629efaefbf549e99e5e2768f6acfb458c92dd6abfe8ceccf1418a2caca3dea607',
address: '0xA4C0c9e95ef693464383b9CF4E405d9a3E7aE825'
}

```
npx hardhat --network lachain register-entity --contract-address 0x6aD18D9D66933eF51D3bE117c425Ce355251f213 --entity-address 0xA4C0c9e95ef693464383b9CF4E405d9a3E7aE825 --domain "entity1.cvu" --public-key 0x56e67a981b41f64c587bb9750ca5d6cd12f240c6f6ba2439277f882843d5054629efaefbf549e99e5e2768f6acfb458c92dd6abfe8ceccf1418a2caca3dea607
```

## Register entity 2 (sender: admin)

Example entity data : {
domain: entity2.cvu
privateKey: '0xe42..',
publicKey: 'cc95c03effdb2486c2f59878125840bfce43324452c8ae63a992adeb77b7c9049c81e96b7dc23df9d291c776f9aee699e6655785a593aa3958ed677b0b91c120',
address: '0x39f76952100495698C5a9a0441DcD14fBB814bE3'
}

```
npx hardhat --network lachain register-entity --contract-address 0x6aD18D9D66933eF51D3bE117c425Ce355251f213 --entity-address 0x39f76952100495698C5a9a0441DcD14fBB814bE3 --domain "entity2.cvu" --public-key 0xcc95c03effdb2486c2f59878125840bfce43324452c8ae63a992adeb77b7c9049c81e96b7dc23df9d291c776f9aee699e6655785a593aa3958ed677b0b91c120
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
npx hardhat --network lachain erc20-transfer --erc20-address 0x3b9d9e6c956f2885a272ca1da2aa63bf59bdf939 --to 0xA4C0c9e95ef693464383b9CF4E405d9a3E7aE825 --amount 100
```

```
npx hardhat --network lachain erc20-transfer --erc20-address 0x3b9d9e6c956f2885a272ca1da2aa63bf59bdf939 --to 0x39f76952100495698C5a9a0441DcD14fBB814bE3 --amount 100
```

## Step 2 - batch transfer Request (sender: entity 1)

userOrigin = "user_origin";
userDestination = "user_destination";

how to encrypt data in helper section.

### Approve tokens to qiu contract (sender: entity 1)

```
npx hardhat --network lachain erc20-approve --erc20-address 0x3b9d9e6c956f2885a272ca1da2aa63bf59bdf939 --spender 0x1a5FD953DfD5443F7A4452F4A639B0967C9b79cC --amount 100
```

### batch transfer Request (sender: entity 1)

```
npx hardhat --network lachain batch-transfer-request --contract-address 0x6aD18D9D66933eF51D3bE117c425Ce355251f213 --origin-domains entity1.cvu,entity1.cvu --destination-domains entity2.cvu,entity2.cvu --amounts 1,2 --encrypted-origins 0x547195888b88195bb660b00241048c7503dffe07cef74791200afff11d2974e7804fea944fc0aaa510162e6f70690de25a60dd14e069cb060628497e22f1472f8fe1a192e5c58b14bbce13552e1f1deb833c8b81396c34e8cc47871d4f6cc96561,0x547195888b88195bb660b00241048c7503dffe07cef74791200afff11d2974e7804fea944fc0aaa510162e6f70690de25a60dd14e069cb060628497e22f1472f8fe1a192e5c58b14bbce13552e1f1deb833c8b81396c34e8cc47871d4f6cc96561 --encrypted-destinations 0x09cbe19009a59716f03c32a052a9d69c034c12060c846ef364c597bf10f1ccb2a2a4af392762dc943a809dbced34ab3c3a4dbc2c5adcdf57126ccea6b09d00ee134fae48aaf0f7793a7a09490a2a5fdfe12094f76fac3c2bbac80d77aaa2c1d9dcb1acf8aecbfab623676b5f3c62f7362b,0x09cbe19009a59716f03c32a052a9d69c034c12060c846ef364c597bf10f1ccb2a2a4af392762dc943a809dbced34ab3c3a4dbc2c5adcdf57126ccea6b09d00ee134fae48aaf0f7793a7a09490a2a5fdfe12094f76fac3c2bbac80d77aaa2c1d9dcb1acf8aecbfab623676b5f3c62f7362b --expirations 100000,100000 --external-refs "",""
```

transferHash: 0x449de24bbe3236353b131865d29db1861f4d16b79893ce6007eafee0e0196dfa

## Step 3 - Batch accept Transfers (sender: entity 2)

```
npx hardhat --network lachain batch-accept-transfers --contract-address 0x6aD18D9D66933eF51D3bE117c425Ce355251f213 0xe326055a838a06485aafcf790cd621f16aa524aa5602a15d3bc82d918782047a
```

## Helpers

### encrypt data

userOrigin = "user_origin";
userDestination = "user_destination";

Encrypt data exampleOrigin:

```
npx hardhat encrypt --data "user_origin" --public-key cc95c03effdb2486c2f59878125840bfce43324452c8ae63a992adeb77b7c9049c81e96b7dc23df9d291c776f9aee699e6655785a593aa3958ed677b0b91c120
```

encryptedData: 547195888b88195bb660b00241048c7503dffe07cef74791200afff11d2974e7804fea944fc0aaa510162e6f70690de25a60dd14e069cb060628497e22f1472f8fe1a192e5c58b14bbce13552e1f1deb833c8b81396c34e8cc47871d4f6cc96561

Decrypt data:

```
npx hardhat decrypt --encrypted-data 547195888b88195bb660b00241048c7503dffe07cef74791200afff11d2974e7804fea944fc0aaa510162e6f70690de25a60dd14e069cb060628497e22f1472f8fe1a192e5c58b14bbce13552e1f1deb833c8b81396c34e8cc47871d4f6cc96561 --private-key 0xe42...
```

Encrypt data exampleDestination:

```
npx hardhat encrypt --data "user_destination" --public-key cc95c03effdb2486c2f59878125840bfce43324452c8ae63a992adeb77b7c9049c81e96b7dc23df9d291c776f9aee699e6655785a593aa3958ed677b0b91c120
```

encryptedCvu: 09cbe19009a59716f03c32a052a9d69c034c12060c846ef364c597bf10f1ccb2a2a4af392762dc943a809dbced34ab3c3a4dbc2c5adcdf57126ccea6b09d00ee134fae48aaf0f7793a7a09490a2a5fdfe12094f76fac3c2bbac80d77aaa2c1d9dcb1acf8aecbfab623676b5f3c62f7362b

### check balance erc20 tokens

```
npx hardhat --network lachain erc20-balance --erc20-address 0x903CA313eB4944663aC470Cf88152dF1f27ffc0f --address <account_address>
```

### check native balance

```
npx hardhat --network lachain native-balance --address <account_address>
```
