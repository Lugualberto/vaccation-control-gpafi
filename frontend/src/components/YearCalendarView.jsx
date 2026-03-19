import {
  addDays,
  endOfMonth,
  endOfYear,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

function isEventOnDay(event, day) {
  const eventStart = new Date(event.start);
  const eventEndExclusive = new Date(event.end);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEndExclusive = addDays(dayStart, 1);
  return eventStart < dayEndExclusive && eventEndExclusive > dayStart;
}

function getDayDots(events) {
  const hasVacation = events.some((event) => event.eventType === "VACATION");
  const hasDayOff = events.some((event) => event.eventType === "DAY_OFF");
  return { hasVacation, hasDayOff };
}

function MonthCard({ monthDate, events }) {
  const monthStart = startOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const cells = [];

  let cursor = gridStart;
  while (cells.length < 42) {
    const eventsForDay = events.filter((event) => isEventOnDay(event, cursor));
    const dots = getDayDots(eventsForDay);

    cells.push(
      <div
        key={cursor.toISOString()}
        className={`year-day ${isSameMonth(cursor, monthDate) ? "" : "is-outside-month"}`}
      >
        <span>{format(cursor, "d")}</span>
        <span className="year-day-dots">
          {dots.hasVacation ? <i className="dot-vacation" /> : null}
          {dots.hasDayOff ? <i className="dot-dayoff" /> : null}
        </span>
      </div>
    );

    cursor = addDays(cursor, 1);
  }

  return (
    <article className="year-month-card">
      <h4>{format(monthDate, "MMMM yyyy")}</h4>
      <div className="year-weekdays">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>
      <div className="year-grid">{cells}</div>
    </article>
  );
}

export default function YearCalendarView({ date, events }) {
  const yearStart = startOfYear(date);
  const months = [];
  let cursor = yearStart;
  const yearEnd = endOfYear(date);

  while (cursor <= yearEnd) {
    months.push(cursor);
    cursor = addDays(endOfMonth(cursor), 1);
  }

  return (
    <div className="year-calendar-wrapper">
      {months.map((monthDate) => (
        <MonthCard key={monthDate.toISOString()} monthDate={monthDate} events={events} />
      ))}
    </div>
  );
}
