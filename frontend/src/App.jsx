import { Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import BlogList from "./pages/BlogList.jsx";
import BlogPost from "./pages/BlogPost.jsx";
import Cart from "./pages/Cart.jsx";
import Collections from "./pages/Collections.jsx";
import CreatePost from "./pages/CreatePost.jsx";
import CreatePoll from "./pages/CreatePoll.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Orders from "./pages/Orders.jsx";
import PollDetail from "./pages/PollDetail.jsx";
import PollsList from "./pages/PollsList.jsx";
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
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/new" element={<CreatePost />} />
      <Route path="/blog/:postId" element={<BlogPost />} />
      <Route path="/polls" element={<PollsList />} />
      <Route path="/polls/new" element={<CreatePoll />} />
      <Route path="/polls/:pollId" element={<PollDetail />} />
      <Route path="*" element={<Home />} />
    </Routes>
  </Layout>
);

export default App;
