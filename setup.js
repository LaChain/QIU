const { getSignerInConfig, setProvider } = require("./utils/helpers");

async function main() {
  if (process.env.SELECTED_NETWORK) {
    await setProvider(process.env.SELECTED_NETWORK);
  }
  if (process.env.SELECTED_SENDER) {
    const sender = await getSignerInConfig(process.env.SELECTED_SENDER);
    hre.network.config.sender = sender;
  }
}

module.exports = {
  main,
};
