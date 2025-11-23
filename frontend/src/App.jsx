import { Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import Cart from "./pages/Cart.jsx";
import Collections from "./pages/Collections.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Orders from "./pages/Orders.jsx";
import Register from "./pages/Register.jsx";
import "./App.css";

const App = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/collections" element={<Collections />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="*" element={<Home />} />
    </Routes>
  </Layout>
);

export default App;
