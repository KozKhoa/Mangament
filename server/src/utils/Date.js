export function forEachDate(fromDate, toDate, callback = (date = new Date()) => {}) {
  const current = new Date(fromDate);

  //   current.setHours(0, 0, 0, 0);

  const end = new Date(toDate);
  //   end.setHours(23, 59, 59, 0);

  for (; current <= end; current.setDate(current.getDate() + 1)) {
    callback(new Date(current));
  }
}
