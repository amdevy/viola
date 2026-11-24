/**
 * In-memory stand-in for the few supabase-js query shapes the GA reporting
 * uses: select(...).eq().maybeSingle(), and update(...).eq().is().select()
 * awaited directly. Filters and updates act on the rows given, so tests can
 * assert on the stored state afterwards.
 */
type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string } | null };

export type FakeSupabase = ReturnType<typeof fakeSupabase>;

export function fakeSupabase(
  tables: Record<string, Row[]>,
  options: { missingColumns?: string[] } = {}
) {
  const missingColumns = options.missingColumns ?? [];
  const updates: { table: string; patch: Row }[] = [];

  function from(table: string) {
    let op: "select" | "update" = "select";
    let columns = "";
    let patch: Row = {};
    let returnRows = false;
    const filters: ((row: Row) => boolean)[] = [];

    function run(): Result {
      const referenced = op === "update" ? Object.keys(patch).join(",") : columns;
      const missing = missingColumns.find((c) => referenced.includes(c));
      if (missing) {
        return { data: null, error: { message: `column ${table}.${missing} does not exist` } };
      }
      const rows = (tables[table] ?? []).filter((row) => filters.every((f) => f(row)));
      if (op === "update") {
        for (const row of rows) Object.assign(row, patch);
        updates.push({ table, patch });
        return { data: returnRows ? rows.map((r) => ({ ...r })) : null, error: null };
      }
      return { data: rows.map((r) => ({ ...r })), error: null };
    }

    const builder = {
      select(cols: string) {
        if (op === "update") returnRows = true;
        else columns = cols;
        return builder;
      },
      update(values: Row) {
        op = "update";
        patch = values;
        return builder;
      },
      eq(column: string, value: unknown) {
        filters.push((row) => row[column] === value);
        return builder;
      },
      is(column: string, value: unknown) {
        filters.push((row) => (row[column] ?? null) === value);
        return builder;
      },
      maybeSingle() {
        const result = run();
        if (result.error) return Promise.resolve(result);
        return Promise.resolve({ data: (result.data as Row[])[0] ?? null, error: null });
      },
      then<T>(resolve: (r: Result) => T, reject?: (e: unknown) => T) {
        return Promise.resolve(run()).then(resolve, reject);
      },
    };
    return builder;
  }

  return { client: { from }, tables, updates };
}
