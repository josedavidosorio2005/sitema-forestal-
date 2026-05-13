const buckets = new Map();

function toPositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function createRateLimiter(options = {}) {
  const windowMs = toPositiveNumber(options.windowMs, 15 * 60 * 1000);
  const maxRequests = toPositiveNumber(options.maxRequests, 300);

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const current = buckets.get(ip);

    if (!current || now > current.resetAt) {
      buckets.set(ip, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    current.count += 1;

    if (current.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Intenta de nuevo mas tarde.',
      });
      return;
    }

    next();
  };
}
