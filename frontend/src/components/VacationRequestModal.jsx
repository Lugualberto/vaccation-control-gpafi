import { useMemo, useState } from "react";

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function countCalendarDays(startDate, endDate) {
  const cursor = new Date(startDate);
  let count = 0;

  while (cursor <= endDate) {
    count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

export default function VacationRequestModal({ open, selectedRange, onClose, onConfirm }) {
  const [justification, setJustification] = useState("");
  const [eventType, setEventType] = useState("VACATION");
  const [submitting, setSubmitting] = useState(false);

  const period = useMemo(() => {
    if (!selectedRange) {
      return null;
    }
    const calendarDays = countCalendarDays(selectedRange.start, selectedRange.end);
    return {
      startDate: formatDate(selectedRange.start),
      endDate: formatDate(selectedRange.end),
      calendarDays,
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
        eventType,
      });
      setJustification("");
      setEventType("VACATION");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal">
        <h3>Confirm calendar event</h3>
        <p>
          Period: <strong>{period.startDate}</strong> to <strong>{period.endDate}</strong>
        </p>
        <p>
          Estimated calendar days: <strong>{period.calendarDays}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="eventType">Event type</label>
          <select
            id="eventType"
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
          >
            <option value="VACATION">Vacation</option>
            <option value="DAY_OFF">Day Off</option>
          </select>
          {eventType === "DAY_OFF" ? (
            <p className="hint-text">
              Day Off does not consume vacation balance in this phase.
            </p>
          ) : null}
          <label htmlFor="justification">Notes (optional)</label>
          <textarea
            id="justification"
            rows={4}
            value={justification}
            onChange={(event) => setJustification(event.target.value)}
            placeholder="Ex.: family trip"
          />
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
