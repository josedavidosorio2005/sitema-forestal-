import dotenv from 'dotenv';

dotenv.config();

const url = process.env.HEALTHCHECK_URL || `http://localhost:${process.env.PORT || 5000}/api/health`;

try {
  const response = await fetch(url);
  const body = await response.json();

  if (!response.ok || body.success !== true) {
    console.error(`Health check failed: ${response.status}`, body);
    process.exit(1);
  }

  console.log(`Health check OK: ${url}`);
} catch (error) {
  console.error(`Health check failed: ${url}`);
  console.error(error.message);
  process.exit(1);
}
