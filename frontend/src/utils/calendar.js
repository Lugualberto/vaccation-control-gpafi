import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";

const locales = {
  "en-US": enUS,
};

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export const formats = {
  monthHeaderFormat: "MMMM yyyy",
  dayHeaderFormat: "EEEEEE, MM/dd",
  dayRangeHeaderFormat: ({ start, end }, culture, localizerInstance) =>
    `${localizerInstance.format(start, "MM/dd", culture)} - ${localizerInstance.format(
      end,
      "MM/dd",
      culture
    )}`,
};

function parseCalendarDate(value) {
  const rawValue = value ?? "";
  if (typeof rawValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    const [year, month, day] = rawValue.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(rawValue);
}

export function toCalendarEvent(vacation) {
  const start = parseCalendarDate(vacation.START_DATE || vacation.start_date);
  const endRaw = parseCalendarDate(vacation.END_DATE || vacation.end_date);
  const end = new Date(endRaw);
  end.setDate(end.getDate() + 1);
  const employeeName = vacation.EMPLOYEE_NAME || vacation.employee_name || "Teammate";
  const status = vacation.STATUS || vacation.status;
  const eventType = vacation.EVENT_TYPE || vacation.event_type || "VACATION";
  const eventLabel = eventType === "DAY_OFF" ? "Day Off" : "Vacation";

  return {
    id: vacation.ID || vacation.id,
    title: `${employeeName} • ${eventLabel}`,
    start,
    end,
    allDay: true,
    status,
    eventType,
    employeeId: vacation.EMPLOYEE_ID || vacation.employee_id,
    employeeName,
  };
}

export { Calendar };
