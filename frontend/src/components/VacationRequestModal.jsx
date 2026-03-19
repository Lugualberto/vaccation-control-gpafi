import { useMemo, useState } from "react";

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function countBusinessDays(startDate, endDate) {
  const cursor = new Date(startDate);
  let count = 0;

  while (cursor <= endDate) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

export default function VacationRequestModal({ open, selectedRange, onClose, onConfirm }) {
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const period = useMemo(() => {
    if (!selectedRange) {
      return null;
    }
    const businessDays = countBusinessDays(selectedRange.start, selectedRange.end);
    return {
      startDate: formatDate(selectedRange.start),
      endDate: formatDate(selectedRange.end),
      businessDays,
    };
  }, [selectedRange]);

  if (!open || !period) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await onConfirm({
        startDate: period.startDate,
        endDate: period.endDate,
        justification,
      });
      setJustification("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal">
        <h3>Confirmar solicitação de férias</h3>
        <p>
          Período: <strong>{period.startDate}</strong> até <strong>{period.endDate}</strong>
        </p>
        <p>
          Dias úteis estimados: <strong>{period.businessDays}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="justification">Justificativa (opcional)</label>
          <textarea
            id="justification"
            rows={4}
            value={justification}
            onChange={(event) => setJustification(event.target.value)}
            placeholder="Ex.: férias escolares da família"
          />
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? "Enviando..." : "Confirmar pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
