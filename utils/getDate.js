function getNextWeekDates() {
  const dates = [];
  const now = new Date();
  const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1));
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}
export default getNextWeekDates;