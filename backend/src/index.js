const http = require("http");

const app = require("./app");
const { port } = require("./config");

const server = http.createServer(app);

server.on("error", (error) => {
  // eslint-disable-next-line no-console
  console.error("Server startup error", error);
  process.exit(1);
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${port}`);
});
