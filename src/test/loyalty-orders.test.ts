import { spawnSync } from 'node:child_process';
import { chownSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Run the real migration function in disposable PostgreSQL, never the app database.
const migration = readFileSync(
  path.resolve(
    'supabase/migrations/20261031090000_harden_loyalty_trigger_for_deleted_customers.sql',
  ),
  'utf8',
);
const functionSql = migration.match(/create or replace function[\s\S]*?\$\$;/i)?.[0];
const directory = mkdtempSync(path.join(os.tmpdir(), 'ibuzz-loyalty-test-'));
const dataDirectory = path.join(directory, 'data');
const identity = process.getuid?.() === 0 ? { uid: 1000, gid: 1000 } : {};
if (identity.uid !== undefined) chownSync(directory, identity.uid, identity.gid);

function binary(name: string) {
  if (spawnSync(name, ['--version']).status === 0) return name;
  // Ubuntu CI installs PostgreSQL binaries outside PATH.
  const versions = readdirSync('/usr/lib/postgresql').sort().reverse();
  for (const version of versions) {
    const candidate = `/usr/lib/postgresql/${version}/bin/${name}`;
    if (spawnSync(candidate, ['--version']).status === 0) return candidate;
  }
  throw new Error(`PostgreSQL ${name} is required for the isolated loyalty regression test.`);
}

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { ...identity, encoding: 'utf8', timeout: 20000 });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`);
}

let sql: ReturnType<typeof postgres> | undefined;
let started = false;
let pgCtl = '';

beforeAll(async () => {
  if (!functionSql) throw new Error('Loyalty trigger function missing from migration.');
  pgCtl = binary('pg_ctl');
  run(binary('initdb'), ['-D', dataDirectory, '-U', 'regression', '--auth=trust', '--no-locale']);
  run(pgCtl, [
    '-D',
    dataDirectory,
    '-l',
    path.join(directory, 'postgres.log'),
    '-o',
    `-k ${directory} -c listen_addresses=''`,
    '-w',
    'start',
  ]);
  started = true;
  sql = postgres({ host: directory, user: 'regression', database: 'postgres', max: 1 });
  await sql.unsafe(`
    CREATE TABLE public.orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid,
      status text NOT NULL DEFAULT 'received', payment_status text NOT NULL DEFAULT 'pending',
      total numeric NOT NULL DEFAULT 500
    );
    CREATE TABLE public.loyalty_accounts (
      user_id uuid PRIMARY KEY, referral_code text NOT NULL,
      points_balance integer NOT NULL DEFAULT 0, referred_by uuid, updated_at timestamptz DEFAULT now()
    );
    CREATE TABLE public.loyalty_ledger (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
      points_delta integer NOT NULL, reason text NOT NULL, order_id uuid NOT NULL,
      UNIQUE(user_id, order_id, reason)
    );
    CREATE TABLE public.loyalty_referrals (
      referred_user_id uuid PRIMARY KEY, referrer_user_id uuid NOT NULL, qualifying_order_id uuid NOT NULL
    );
    ${functionSql}
    CREATE TRIGGER ibuzz_award_loyalty_points AFTER UPDATE OF status, payment_status
      ON public.orders FOR EACH ROW EXECUTE FUNCTION public.ibuzz_award_loyalty_points();
  `);
}, 30000);

afterAll(async () => {
  await sql?.end();
  if (started) run(pgCtl, ['-D', dataDirectory, '-m', 'immediate', '-w', 'stop']);
  rmSync(directory, { recursive: true, force: true });
});

describe('accountless order completion with the real loyalty trigger', () => {
  it.each(['together', 'completed first', 'paid first'])(
    'saves completed and paid (%s) without creating loyalty rewards',
    async (sequence) => {
      if (!sql) throw new Error('Test database not initialized.');
      await sql`TRUNCATE orders, loyalty_accounts, loyalty_ledger, loyalty_referrals`;
      const [order] = await sql`INSERT INTO orders (user_id) VALUES (NULL) RETURNING id`;
      if (!order) throw new Error('Test order missing.');
      if (sequence === 'completed first')
        await sql`UPDATE orders SET status = 'completed' WHERE id = ${order.id}`;
      if (sequence === 'paid first')
        await sql`UPDATE orders SET payment_status = 'paid' WHERE id = ${order.id}`;
      await sql`UPDATE orders SET status = 'completed', payment_status = 'paid' WHERE id = ${order.id}`;
      const [saved] =
        await sql`SELECT user_id, status, payment_status FROM orders WHERE id = ${order.id}`;
      expect(saved).toEqual({ user_id: null, status: 'completed', payment_status: 'paid' });
      const [rewards] = await sql`
        SELECT (SELECT count(*)::integer FROM loyalty_accounts) AS accounts,
               (SELECT count(*)::integer FROM loyalty_ledger) AS ledger,
               (SELECT count(*)::integer FROM loyalty_referrals) AS referrals
      `;
      expect(rewards).toEqual({ accounts: 0, ledger: 0, referrals: 0 });
    },
  );

  it('still awards five points for a linked customer completing a 500-baht order', async () => {
    if (!sql) throw new Error('Test database not initialized.');
    await sql`TRUNCATE orders, loyalty_accounts, loyalty_ledger, loyalty_referrals`;
    const userId = '00000000-0000-4000-8000-000000000001';
    const [order] = await sql`INSERT INTO orders (user_id) VALUES (${userId}) RETURNING id`;
    if (!order) throw new Error('Test order missing.');
    await sql`UPDATE orders SET status = 'completed', payment_status = 'paid' WHERE id = ${order.id}`;
    const [account] =
      await sql`SELECT points_balance FROM loyalty_accounts WHERE user_id = ${userId}`;
    expect(account?.points_balance).toBe(5);
    const ledger =
      await sql`SELECT points_delta, reason FROM loyalty_ledger WHERE order_id = ${order.id}`;
    expect(ledger).toEqual([{ points_delta: 5, reason: 'completed_order' }]);
  });
});
