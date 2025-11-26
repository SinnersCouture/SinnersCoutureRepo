import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { fetchPollById, voteOnPoll } from "../services/polls.js";

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

const PollDetail = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState(null);

  const loadPoll = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPollById(pollId, token);
      setPoll(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPoll();
  }, [pollId, token]);

  const handleVote = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!selectedOption) {
      setError("Selecciona una opción para votar");
      return;
    }

    setVoting(true);
    setError(null);

    try {
      const updatedPoll = await voteOnPoll({ token, pollId, opcionId: selectedOption });
      setPoll(updatedPoll);
      setSelectedOption(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setVoting(false);
    }
  };

  const isPollActive = () => {
    if (!poll) {
      return false;
    }
    const now = new Date();
    const fechaFin = new Date(poll.fechaFin);
    return poll.estaActiva && fechaFin > now;
  };

  if (loading) {
    return (
      <div className="page">
        <p>Cargando encuesta...</p>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="page">
        <p className="form__error">{error}</p>
        <Link to="/polls" className="button">
          Volver a encuestas
        </Link>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="page">
        <p>Encuesta no encontrada.</p>
        <Link to="/polls" className="button">
          Volver a encuestas
        </Link>
      </div>
    );
  }

  const totalVotes = calculateTotalVotes(poll.options);
  const active = isPollActive();
  const hasVoted = poll.userVote !== null && poll.userVote !== undefined;
  const canVote = active && token && !hasVoted;

  return (
    <div className="page">
      <div className="page__header">
        <Link to="/polls" className="button button--secondary">
          ← Volver
        </Link>
      </div>

      <article className="poll-detail">
        <header className="poll-detail__header">
          <h1>{poll.pregunta}</h1>
          <div className="poll-detail__meta">
            <span>Creada por {poll.creadaPor.nombre}</span>
            <span>Finaliza: {formatDate(poll.fechaFin)}</span>
            {!active && <span className="poll-status poll-status--inactive">Cerrada</span>}
          </div>
        </header>

        {error && <p className="form__error">{error}</p>}

        {canVote ? (
          <div className="poll-voting">
            <h2 className="section-title">Selecciona una opción</h2>
            <div className="poll-options">
              {poll.options.map((option) => (
                <label key={option.id} className="poll-option-radio">
                  <input
                    type="radio"
                    name="poll-option"
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={() => setSelectedOption(option.id)}
                  />
                  <span>{option.textoOpcion}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              className="button"
              onClick={handleVote}
              disabled={voting || !selectedOption}
            >
              {voting ? "Votando..." : "Votar"}
            </button>
          </div>
        ) : (
          <div className="poll-results">
            <h2 className="section-title">
              Resultados {totalVotes > 0 && `(${totalVotes} votos)`}
            </h2>
            {!token && active && (
              <p>
                <Link to="/login">Inicia sesión</Link> para votar.
              </p>
            )}
            {hasVoted && <p className="form__success">Ya has votado en esta encuesta.</p>}
            {!active && <p className="poll-status-message">Esta encuesta está cerrada.</p>}
            <div className="poll-results-list">
              {poll.options.map((option) => {
                const percentage = calculatePercentage(option.voteCount, totalVotes);

                return (
                  <div key={option.id} className="poll-result-item">
                    <div className="poll-result-item__label">
                      <span>{option.textoOpcion}</span>
                      <span className="poll-result-item__votes">
                        {option.voteCount} votos ({percentage}%)
                      </span>
                    </div>
                    <div className="poll-result-item__bar">
                      <div
                        className="poll-result-item__fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default PollDetail;

