import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { registerRequest } from "../services/auth.js";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await registerRequest({ nombre, email, password });
      login(response);
      navigate("/collections");
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1>Crear cuenta</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label className="form__field">
          <span>Nombre</span>
          <input
            type="text"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            required
          />
        </label>
        <label className="form__field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="form__field">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className="form__error">{error}</p>}
        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
};

export default Register;

