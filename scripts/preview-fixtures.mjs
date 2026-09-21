import { createTestDatabase, loadDevelopmentFixtures } from '../tests/helpers/database.mjs';

// Deliberately accepts no external connection string or disk path.
const db = await createTestDatabase();
try {
  await loadDevelopmentFixtures(db);
  const { rows } = await db.query(`select p.title, d.service_date, d.start_time, d.capacity
    from public.departures d join public.products p on p.id=d.product_id
    order by d.service_date,d.start_time`);
  console.table(rows);
  console.log('Synthetic fixtures loaded in disposable PostgreSQL; no application or hosted database changed.');
} finally { await db.close(); }
