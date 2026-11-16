import { checkPhonePreview } from './phone-preview-health.mjs';

const url = process.argv[2];
if (!url) {
  console.error('Usage: node scripts/check-phone-preview.mjs <phone-preview-url>');
  process.exit(2);
}

const result = await checkPhonePreview(url);
if (!result.ok) {
  console.error(`Phone preview check failed: ${result.reason}`);
  process.exit(1);
}

console.log(`Phone preview is live: ${result.url}`);
