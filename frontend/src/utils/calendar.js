import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const locales = {
  "pt-BR": ptBR,
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
  dayHeaderFormat: "EEEEEE, dd/MM",
  dayRangeHeaderFormat: ({ start, end }, culture, localizerInstance) =>
    `${localizerInstance.format(start, "dd/MM", culture)} - ${localizerInstance.format(
      end,
      "dd/MM",
      culture
    )}`,
};

export function toCalendarEvent(vacation) {
  const start = new Date(vacation.START_DATE || vacation.start_date);
  const endRaw = new Date(vacation.END_DATE || vacation.end_date);
  const end = new Date(endRaw);
  end.setDate(end.getDate() + 1);

  return {
    id: vacation.ID || vacation.id,
    title: (vacation.EMPLOYEE_NAME || vacation.employee_name || "Colaborador") +
      ` (${vacation.STATUS || vacation.status})`,
    start,
    end,
    allDay: true,
    status: vacation.STATUS || vacation.status,
  };
}

export { Calendar };
