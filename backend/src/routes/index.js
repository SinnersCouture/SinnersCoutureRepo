const authRouter = require("./auth");
const catalogRouter = require("./catalog");
const cartRouter = require("./cart");
const ordersRouter = require("./orders");
const blogRouter = require("./blog");
const pollsRouter = require("./polls");

const registerRoutes = (app) => {
  app.use("/auth", authRouter);
  app.use("/catalog", catalogRouter);
  app.use("/cart", cartRouter);
  app.use("/orders", ordersRouter);
  app.use("/blog", blogRouter);
  app.use("/polls", pollsRouter);
};

module.exports = {
  registerRoutes,
};

