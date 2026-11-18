import pg from 'pg';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

export const q = (text, params) => pool.query(text, params);

export const TODAY_IST = `(now() AT TIME ZONE 'Asia/Kolkata')::date`;

export const currentMonthIST = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7);

export const DEFAULT_TPL =
  'নমস্কার {নাম}, {মাস} মাসের চাঁদা ₹{টাকা} এখনো জমা পড়েনি। দয়া করে তাড়াতাড়ি জমা দিন। ধন্যবাদ।';

const SEED_MEMBERS = [
  ['SUMON MONDAL', '7908670578'], ['SOURAV MONDAL', '7602770490'], ['APURBA MONDAL', '9064701904'],
  ['SOUVIK GHOSH', '9547331789'], ['BISOJIT GHOSH', '8918756516'], ['MANTU GHOSH', '9932637944'],
  ['SOUMYA GHOSH', '6290994483'], ['PIJUSH GHOSH', '7365915766'], ['SOUDIP MONDAL', '7063778430'],
  ['SAYANTAN GHOSH', '9635215801'], ['SONTU GHOSH', '9064653774'], ['SUBRATA MONDAL', '9749103919'],
  ['SHIBAM GHOSH', '9907620994'], ['SUKAMAL GHOSH', '7811009176'], ['PRITAM GHOSH', '9734800503'],
];

export async function initDb() {
  await q(`
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      amt INTEGER NOT NULL DEFAULT 0,
      start_month CHAR(7) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payments (
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      month CHAR(7) NOT NULL,
      amt INTEGER NOT NULL,
      paid_on DATE NOT NULL DEFAULT ${TODAY_IST},
      PRIMARY KEY (member_id, month)
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      month CHAR(7) NOT NULL,
      description TEXT NOT NULL,
      amt INTEGER NOT NULL,
      spent_on DATE NOT NULL DEFAULT ${TODAY_IST}
    );
    CREATE INDEX IF NOT EXISTS expenses_month_idx ON expenses(month);
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  await q(
    `INSERT INTO settings(key,value) VALUES ('org',$1),('day','15'),('tpl',$2),('seeded','0')
     ON CONFLICT (key) DO NOTHING`,
    ['পালংপুর অমর স্মৃতি সংঘ', DEFAULT_TPL]
  );
  const { rows } = await q(`SELECT value FROM settings WHERE key='seeded'`);
  if (rows[0].value === '0') {
    const { rows: c } = await q('SELECT count(*)::int AS n FROM members');
    if (c[0].n === 0) {
      const start = currentMonthIST();
      for (const [name, phone] of SEED_MEMBERS) {
        await q('INSERT INTO members(name,phone,amt,start_month) VALUES ($1,$2,330,$3)', [name, phone, start]);
      }
    }
    await q(`UPDATE settings SET value='1' WHERE key='seeded'`);
  }
}
