import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { fetchPolls } from "../services/polls.js";

const formatDate = (value) => {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleDateString("es-ES");
};

const calculateTotalVotes = (options) => {
  return options.reduce((sum, option) => sum + option.voteCount, 0);
};

const calculatePercentage = (votes, total) => {
  if (total === 0) {
    return 0;
  }
  return Math.round((votes / total) * 100);
};

const PollsList = () => {
  const { token, user } = useAuth();

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPolls = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPolls();
      setPolls(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
  }, []);

  return (
    <div className="page">
      <div className="page__header">
        <h1>Encuestas</h1>
        {user?.isAdmin && (
          <Link to="/polls/new" className="button">
            Nueva encuesta
          </Link>
        )}
      </div>

      {error && <p className="form__error">{error}</p>}

      {loading ? (
        <p>Cargando encuestas...</p>
      ) : polls.length === 0 ? (
        <p>No hay encuestas activas.</p>
      ) : (
        <div className="polls-list">
          {polls.map((poll) => {
            const totalVotes = calculateTotalVotes(poll.options);

            return (
              <article key={poll.id} className="poll-card">
                <header className="poll-card__header">
                  <h2>
                    <Link to={`/polls/${poll.id}`}>{poll.pregunta}</Link>
                  </h2>
                  <div className="poll-card__meta">
                    <span>Creada por {poll.creadaPor.nombre}</span>
                    <span>Finaliza: {formatDate(poll.fechaFin)}</span>
                  </div>
                </header>
                <div className="poll-card__results">
                  {poll.options.map((option) => {
                    const percentage = calculatePercentage(option.voteCount, totalVotes);

                    return (
                      <div key={option.id} className="poll-option">
                        <div className="poll-option__label">
                          <span>{option.textoOpcion}</span>
                          <span className="poll-option__votes">
                            {option.voteCount} votos ({percentage}%)
                          </span>
                        </div>
                        <div className="poll-option__bar">
                          <div
                            className="poll-option__fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <footer className="poll-card__footer">
                  <Link to={`/polls/${poll.id}`} className="button button--secondary">
                    Ver detalles
                  </Link>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PollsList;

