const authRouter = require("./auth");
const catalogRouter = require("./catalog");
const cartRouter = require("./cart");
const ordersRouter = require("./orders");

const registerRoutes = (app) => {
  app.use("/auth", authRouter);
  app.use("/catalog", catalogRouter);
  app.use("/cart", cartRouter);
  app.use("/orders", ordersRouter);
};

module.exports = {
  registerRoutes,
};

