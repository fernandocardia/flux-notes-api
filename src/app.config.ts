import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  maxNotes: (() => {
    const raw = process.env.MAX_NOTES;
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1000;
  })(),
}));
