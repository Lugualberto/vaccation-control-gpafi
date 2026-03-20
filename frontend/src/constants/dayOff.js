export const DAY_OFF_FULL_DAY_HOURS = 8;
export const DAY_OFF_HALF_DAY_HOURS = 4;

export const DAY_OFF_DURATION = {
  FULL_DAY: "FULL_DAY",
  HALF_DAY: "HALF_DAY",
};

export const DAY_OFF_UNLIMITED_EMAILS = new Set([
  "luana.gualberto@nubank.com.br",
  "camila.palomo@nubank.com.br",
  "leticia.oliveira@nubank.com.br",
  "arturo.frias@nubank.com.br",
  // Legacy aliases kept for already-seeded users in shared mock storage.
  "leticia.prado@nubank.com.br",
  "arturo.lima@nubank.com.br",
]);

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isUnlimitedDayOffEmail(email) {
  return DAY_OFF_UNLIMITED_EMAILS.has(normalizeEmail(email));
}

export function getDayOffHoursPerDay(duration) {
  return duration === DAY_OFF_DURATION.HALF_DAY
    ? DAY_OFF_HALF_DAY_HOURS
    : DAY_OFF_FULL_DAY_HOURS;
}
