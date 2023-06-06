# Deployment

## Deploy contracts in LAchain testnet

1. First setup these environments vars in .env file

```
LACHAIN_TESTNET_RPC_URL=https://rpc.testnet.lachain.network
PRIVATE_KEY=dfba...
```

2. Execute the deployment of the contracts

```
npx hardhat run scripts/deploy.js --network lachain
```

## Run api

To run the API, please ensure that you have Docker installed and running on your system.

```
docker-compose up
```
