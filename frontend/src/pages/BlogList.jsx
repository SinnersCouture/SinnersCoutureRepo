import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { deletePost, fetchPosts } from "../services/blog.js";

const formatDate = (value) => {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString("es-ES");
};

const BlogList = () => {
  const { token, user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDelete = async (postId) => {
    if (!token) {
      return;
    }

    if (!window.confirm("¿Estás seguro de que quieres eliminar esta publicación?")) {
      return;
    }

    try {
      await deletePost({ token, postId });
      await loadPosts();
    } catch (err) {
      setError(err.message);
    }
  };

  const getPreview = (contenido) => {
    if (contenido.length <= 150) {
      return contenido;
    }
    return contenido.substring(0, 150) + "...";
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>Blog</h1>
        {token && (
          <Link to="/blog/new" className="button">
            Nueva publicación
          </Link>
        )}
      </div>

      {error && <p className="form__error">{error}</p>}

      {loading ? (
        <p>Cargando publicaciones...</p>
      ) : posts.length === 0 ? (
        <p>No hay publicaciones aún.</p>
      ) : (
        <div className="blog-list">
          {posts.map((post) => (
            <article key={post.id} className="blog-post-card">
              <header className="blog-post-card__header">
                <h2>
                  <Link to={`/blog/${post.id}`}>{post.titulo}</Link>
                </h2>
                <div className="blog-post-card__meta">
                  <span>Por {post.autor.nombre}</span>
                  <span>{formatDate(post.fechaCreacion)}</span>
                </div>
              </header>
              <div className="blog-post-card__content">
                <p>{getPreview(post.contenido)}</p>
              </div>
              <footer className="blog-post-card__footer">
                <Link to={`/blog/${post.id}`} className="button button--secondary">
                  Leer más
                </Link>
                {(user?.id === post.autor.id || user?.isAdmin) && (
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => handleDelete(post.id)}
                  >
                    Eliminar
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogList;

