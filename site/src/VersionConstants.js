
function getLastTwoWeeksDateStamps() {
  const dateStamps = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      const year = pastDate.getFullYear();
      const month = String(pastDate.getMonth() + 1).padStart(2, '0');
      const day = String(pastDate.getDate()).padStart(2, '0');
      dateStamps.push(`${year}-${month}-${day}`);
  }

  return dateStamps;
}

export const TWO_WEEKS_DS = getLastTwoWeeksDateStamps();

// TODO: Get from manifest once the generation is finalized!
export const VERSION_OPTIONS = [
  "2025-03-19.1",
  "2025-02-19.0",
  "2025-01-22.0",
  "2024-12-18.0",
  "2024-11-13.0",
  "2024-10-23.0",
  "2024-09-18.0",
  "2024-08-20.0",
  "2024-07-22.0",
];