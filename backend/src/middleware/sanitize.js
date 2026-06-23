const validator = require('validator');

// Strip HTML tags and null-byte characters from a single string value.
function cleanString(val) {
  if (typeof val !== 'string') return val;
  // Remove null bytes, then strip all HTML tags
  return validator.stripLow(validator.escape(val), true)
    // unescape back to plain text — escape() encodes entities for display;
    // we want to strip tags but keep readable text for DB storage
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')   // these survive stripLow so strip the raw chars below
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x60;/g, '`');
}

// A simpler, more direct approach: strip HTML tags without entity-encoding the rest
function stripHtml(val) {
  if (typeof val !== 'string') return val;
  return val
    .replace(/\0/g, '')                           // null bytes
    .replace(/<[^>]*>/g, '')                      // HTML tags
    .replace(/javascript\s*:/gi, '')              // javascript: URIs
    .replace(/on\w+\s*=/gi, '')                   // inline event handlers
    .trim();
}

// Recursively sanitize all string values in req.body
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj) {
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj !== null && typeof obj === 'object') {
    const clean = {};
    for (const key of Object.keys(obj)) {
      clean[key] = sanitizeObject(obj[key]);
    }
    return clean;
  }
  if (typeof obj === 'string') return stripHtml(obj);
  return obj;
}

module.exports = { sanitizeBody, stripHtml };
