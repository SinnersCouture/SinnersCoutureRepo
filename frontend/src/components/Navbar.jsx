import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <Link to="/">Sinners Couture</Link>
      </div>
      <nav className="navbar__links">
        <NavLink to="/collections">Colecciones</NavLink>
        <NavLink to="/blog">Blog</NavLink>
        <NavLink to="/polls">Encuestas</NavLink>
        {user && <NavLink to="/cart">Carrito</NavLink>}
        {user && <NavLink to="/orders">Pedidos</NavLink>}
      </nav>
      <div className="navbar__auth">
        {user ? (
          <>
            <span className="navbar__user">{user.nombre}</span>
            <button type="button" onClick={handleLogout} className="navbar__button">
              Salir
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Acceder</NavLink>
            <NavLink to="/register">Crear cuenta</NavLink>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;

