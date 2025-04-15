export function getMaxDays(year: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new Error("Month must be between 1 and 12.");
  }

  if (year < 1000 || year > 9999) {
    throw new Error("Year must be between 1 and 12.");
  }

  return new Date(year, month, 0).getDate();
}

export function getCurrentDate() {
  const now = new Date();
  return {
    currYear: now.getFullYear(),
    currMonth: now.getMonth() + 1,
    currDay: now.getDate(),
  };
}
