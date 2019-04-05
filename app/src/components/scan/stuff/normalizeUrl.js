var normalizeUrl = function(url) {
  // Remove leading/trailing white space from protocol, normalize casing, etc.
  var normalized;
  try {
    normalized = new URL(url);
  } catch (exception) {
    return;
  }
  return normalized;
};
