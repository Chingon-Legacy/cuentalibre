// TEMP-SCREENSHOT-MOCK — DELETE AFTER QA. Not part of the product.
// @ts-ignore - sql.js ships without types; temp file only
import initSqlJs from "sql.js";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

class BrowserDb {
  constructor(private sdb: any) {}

  private prep(sql: string, params: any[]) {
    // plugin-sql treats $N as a positional reference: every occurrence of
    // the same $N binds the same value. Expand to plain ? placeholders.
    const expanded: any[] = [];
    const q = sql.replace(/\$(\d+)/g, (_m, n) => {
      expanded.push(params[Number(n) - 1]);
      return "?";
    });
    const stmt = this.sdb.prepare(q);
    if (expanded.length) stmt.bind(expanded);
    return stmt;
  }

  async execute(sql: string, params: any[] = []) {
    const stmt = this.prep(sql, params);
    while (stmt.step()) {
      /* drain */
    }
    stmt.free();
    const r = this.sdb.exec("SELECT last_insert_rowid() AS id");
    const lastInsertId = r.length && r[0].values.length ? r[0].values[0][0] : 0;
    return { lastInsertId };
  }

  async select<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.prep(sql, params);
    const rows: any[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows as T[];
  }
}

let p: Promise<BrowserDb> | null = null;

export function getBrowserDb(): Promise<BrowserDb> {
  if (!p) {
    p = (async () => {
      const SQL = await initSqlJs({ locateFile: () => `/sql-wasm.wasm` });
      return new BrowserDb(new SQL.Database());
    })();
  }
  return p;
}
