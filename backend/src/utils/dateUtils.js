function parseIsoDate(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return null;
  }

  const date = new Date(`${dateString}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateDateRange(startDateString, endDateString) {
  const startDate = parseIsoDate(startDateString);
  const endDate = parseIsoDate(endDateString);

  if (!startDate || !endDate) {
    throw new Error("Datas invalidas. Use o formato YYYY-MM-DD.");
  }

  if (endDate < startDate) {
    throw new Error("A data final deve ser maior ou igual a data inicial.");
  }

  return { startDate, endDate };
}

function calculateBusinessDays(startDateString, endDateString) {
  const { startDate, endDate } = validateDateRange(startDateString, endDateString);
  let count = 0;
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      count += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return count;
}

module.exports = {
  calculateBusinessDays,
  parseIsoDate,
};
