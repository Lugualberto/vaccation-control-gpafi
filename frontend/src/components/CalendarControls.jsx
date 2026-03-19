const VIEW_LABELS = {
  month: "Month",
  week: "Week",
  day: "Day",
  agenda: "Agenda",
  year: "Year",
};

const VIEW_ORDER = ["month", "week", "day", "agenda", "year"];

export default function CalendarControls({
  activeView,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}) {
  return (
    <div className="calendar-controls">
      <div className="calendar-nav">
        <button type="button" className="ghost" onClick={onPrev}>
          ◀
        </button>
        <button type="button" className="ghost" onClick={onToday}>
          Today
        </button>
        <button type="button" className="ghost" onClick={onNext}>
          ▶
        </button>
      </div>
      <div className="view-switcher">
        {VIEW_ORDER.map((view) => (
          <button
            key={view}
            type="button"
            className={activeView === view ? "view-active" : "ghost"}
            onClick={() => onViewChange(view)}
          >
            {VIEW_LABELS[view]}
          </button>
        ))}
      </div>
    </div>
  );
}
