import Navbar from "./Navbar.jsx";

const Layout = ({ children }) => (
  <div className="layout">
    <Navbar />
    <main className="layout__content">{children}</main>
  </div>
);

export default Layout;

