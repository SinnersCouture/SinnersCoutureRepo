import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { createPost } from "../services/blog.js";

const CreatePost = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="page">
        <h1>Nueva publicación</h1>
        <p>Debes iniciar sesión para crear una publicación.</p>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      const post = await createPost({ token, titulo, contenido });
      navigate(`/blog/${post.id}`);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1>Nueva publicación</h1>

      <form className="form" onSubmit={handleSubmit}>
        <label className="form__field">
          <span>Título</span>
          <input
            type="text"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            required
            maxLength={255}
          />
        </label>
        <label className="form__field">
          <span>Contenido</span>
          <textarea
            value={contenido}
            onChange={(event) => setContenido(event.target.value)}
            rows={12}
            required
          />
        </label>
        {error && <p className="form__error">{error}</p>}
        <div className="form__actions">
          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? "Publicando..." : "Publicar"}
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate("/blog")}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;

