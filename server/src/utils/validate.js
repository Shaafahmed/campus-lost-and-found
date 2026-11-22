const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// True when every given value is a non-empty string (after trimming)
function filledStrings(...values) {
  return values.every((v) => typeof v === 'string' && v.trim().length > 0);
}

// Checks a date coming from a form. Returns an error message, or null when it is valid.
// A 14-hour allowance is given because "today" in India (UTC+5:30) can already be
// "tomorrow" compared with the server clock in UTC.
function dateError(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Please enter a valid date';
  if (d.getTime() > Date.now() + 14 * 3600 * 1000) return 'Date cannot be in the future';
  return null;
}

module.exports = { EMAIL_RX, filledStrings, dateError };
