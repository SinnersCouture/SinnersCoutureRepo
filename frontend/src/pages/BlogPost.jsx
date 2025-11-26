import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import {
  addComment,
  deleteComment,
  deletePost,
  fetchPostById,
} from "../services/blog.js";

const formatDate = (value) => {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString("es-ES");
};

const BlogPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [post, setPost] = useState(null);
  const [commentContent, setCommentContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState(null);

  const loadPost = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPostById(postId);
      setPost(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [postId]);

  const handleAddComment = async (event) => {
    event.preventDefault();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!commentContent.trim()) {
      setError("El comentario no puede estar vacío");
      return;
    }

    setSubmittingComment(true);
    setError(null);

    try {
      await addComment({ token, postId, contenido: commentContent.trim() });
      setCommentContent("");
      await loadPost();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!token) {
      return;
    }

    if (!window.confirm("¿Estás seguro de que quieres eliminar esta publicación?")) {
      return;
    }

    try {
      await deletePost({ token, postId });
      navigate("/blog");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!token) {
      return;
    }

    try {
      await deleteComment({ token, commentId });
      await loadPost();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <p>Cargando publicación...</p>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="page">
        <p className="form__error">{error}</p>
        <Link to="/blog" className="button">
          Volver al blog
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page">
        <p>Publicación no encontrada.</p>
        <Link to="/blog" className="button">
          Volver al blog
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <Link to="/blog" className="button button--secondary">
          ← Volver
        </Link>
        {(user?.id === post.autor.id || user?.isAdmin) && (
          <button
            type="button"
            className="button button--secondary"
            onClick={handleDeletePost}
          >
            Eliminar publicación
          </button>
        )}
      </div>

      <article className="blog-post">
        <header className="blog-post__header">
          <h1>{post.titulo}</h1>
          <div className="blog-post__meta">
            <span>Por {post.autor.nombre}</span>
            <span>{formatDate(post.fechaCreacion)}</span>
          </div>
        </header>
        <div className="blog-post__content">
          <p style={{ whiteSpace: "pre-wrap" }}>{post.contenido}</p>
        </div>
      </article>

      <section className="blog-comments">
        <h2 className="section-title">Comentarios ({post.comments?.length || 0})</h2>

        {error && <p className="form__error">{error}</p>}

        {token ? (
          <form className="form" onSubmit={handleAddComment}>
            <label className="form__field">
              <span>Escribe un comentario</span>
              <textarea
                value={commentContent}
                onChange={(event) => setCommentContent(event.target.value)}
                rows={4}
                required
              />
            </label>
            <button type="submit" className="button" disabled={submittingComment}>
              {submittingComment ? "Enviando..." : "Publicar comentario"}
            </button>
          </form>
        ) : (
          <p>
            <Link to="/login">Inicia sesión</Link> para comentar.
          </p>
        )}

        {post.comments && post.comments.length > 0 ? (
          <ul className="comments-list">
            {post.comments.map((comment) => (
              <li key={comment.id} className="comment-item">
                <div className="comment-item__header">
                  <span className="comment-item__author">{comment.usuario.nombre}</span>
                  <span className="comment-item__date">{formatDate(comment.fechaCreacion)}</span>
                </div>
                <div className="comment-item__content">
                  <p>{comment.contenido}</p>
                </div>
                {(user?.id === comment.usuario.id || user?.isAdmin) && (
                  <button
                    type="button"
                    className="comment-item__delete"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    Eliminar
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay comentarios aún.</p>
        )}
      </section>
    </div>
  );
};

export default BlogPost;

