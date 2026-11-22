// Removes keys that start with "$" or contain "." from request data.
// This blocks NoSQL-injection payloads such as { "email": { "$gt": "" } }.
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) delete value[key];
      else value[key] = clean(value[key]);
    }
  }
  return value;
}

module.exports = function sanitize(req, res, next) {
  if (req.body) clean(req.body);
  if (req.params) clean(req.params);
  next();
};
