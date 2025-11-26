import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { createPoll } from "../services/polls.js";

const CreatePoll = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [pregunta, setPregunta] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [opciones, setOpciones] = useState(["", ""]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token || !user?.isAdmin) {
    return (
      <div className="page">
        <h1>Nueva encuesta</h1>
        <p>Debes ser administrador para crear una encuesta.</p>
      </div>
    );
  }

  const handleAddOption = () => {
    setOpciones([...opciones, ""]);
  };

  const handleRemoveOption = (index) => {
    if (opciones.length <= 2) {
      setError("Debe haber al menos 2 opciones");
      return;
    }
    setOpciones(opciones.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, value) => {
    const updated = [...opciones];
    updated[index] = value;
    setOpciones(updated);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError(null);

    const validOpciones = opciones.filter((opt) => opt.trim() !== "");

    if (validOpciones.length < 2) {
      setError("Debe haber al menos 2 opciones válidas");
      return;
    }

    setIsSubmitting(true);

    try {
      const poll = await createPoll({
        token,
        pregunta: pregunta.trim(),
        fechaFin,
        opciones: validOpciones,
      });
      navigate(`/polls/${poll.id}`);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  };

  return (
    <div className="page">
      <h1>Nueva encuesta</h1>

      <form className="form" onSubmit={handleSubmit}>
        <label className="form__field">
          <span>Pregunta</span>
          <input
            type="text"
            value={pregunta}
            onChange={(event) => setPregunta(event.target.value)}
            required
          />
        </label>
        <label className="form__field">
          <span>Fecha de finalización</span>
          <input
            type="datetime-local"
            value={fechaFin}
            onChange={(event) => setFechaFin(event.target.value)}
            min={getMinDate()}
            required
          />
        </label>
        <div className="form__field">
          <span>Opciones</span>
          {opciones.map((opcion, index) => (
            <div key={index} className="poll-option-input">
              <input
                type="text"
                value={opcion}
                onChange={(event) => handleOptionChange(index, event.target.value)}
                placeholder={`Opción ${index + 1}`}
                required
              />
              {opciones.length > 2 && (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => handleRemoveOption(index)}
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="button button--secondary"
            onClick={handleAddOption}
          >
            Añadir opción
          </button>
        </div>
        {error && <p className="form__error">{error}</p>}
        <div className="form__actions">
          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear encuesta"}
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate("/polls")}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePoll;

