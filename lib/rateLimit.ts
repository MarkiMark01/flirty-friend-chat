type RateLimitEntry = {
  count: number;
  time: number;
};

const limits: Record<string, RateLimitEntry> = {};

const LIMIT = 10;
const WINDOW = 60_000;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = limits[ip];

  if (!entry) {
    limits[ip] = { count: 1, time: now };
    return false;
  }

  if (now - entry.time > WINDOW) {
    limits[ip] = { count: 1, time: now };
    return false;
  }

  if (entry.count >= LIMIT) {
    return true;
  }

  entry.count += 1;
  return false;
}
