const { createServer } = require("http");

const app = require("./app.js");

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
httpServer.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
