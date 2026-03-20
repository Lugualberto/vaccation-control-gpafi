import { format } from "date-fns";
import { useMemo, useState } from "react";
import { DAY_OFF_DURATION, getDayOffHoursPerDay } from "../constants/dayOff";

function formatDate(date) {
  return format(date, "yyyy-MM-dd");
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

export default function VacationRequestModal({
  open,
  selectedRange,
  onClose,
  onConfirm,
  isUnlimitedDayOff = false,
  availableHourBank = 0,
}) {
  const [justification, setJustification] = useState("");
  const [eventType, setEventType] = useState("VACATION");
  const [dayOffDuration, setDayOffDuration] = useState(DAY_OFF_DURATION.FULL_DAY);
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

  const selectedDayOffHours = period.calendarDays * getDayOffHoursPerDay(dayOffDuration);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await onConfirm({
        startDate: period.startDate,
        endDate: period.endDate,
        justification,
        eventType,
        dayOffDuration,
      });
      setJustification("");
      setEventType("VACATION");
      setDayOffDuration(DAY_OFF_DURATION.FULL_DAY);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal">
        <h3>Confirm calendar event</h3>
        {period.startDate === period.endDate ? (
          <p>
            Date: <strong>{period.startDate}</strong>
          </p>
        ) : (
          <p>
            Period: <strong>{period.startDate}</strong> to <strong>{period.endDate}</strong>
          </p>
        )}
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
            <>
              <label htmlFor="dayOffDuration">Day off duration</label>
              <select
                id="dayOffDuration"
                value={dayOffDuration}
                onChange={(event) => setDayOffDuration(event.target.value)}
              >
                <option value={DAY_OFF_DURATION.FULL_DAY}>Full day (8h)</option>
                <option value={DAY_OFF_DURATION.HALF_DAY}>Half day (4h)</option>
              </select>
              {isUnlimitedDayOff ? (
                <p className="hint-text">
                  Your profile has unlimited day off. This event is recorded on the calendar but
                  does not consume your hour bank.
                </p>
              ) : (
                <p className="hint-text">
                  This day off will consume <strong>{selectedDayOffHours}h</strong> from your hour
                  bank. Available now: <strong>{availableHourBank}h</strong>.
                </p>
              )}
            </>
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
