const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db;
let dbPath;

const DB_FILE = path.join(__dirname, 'reading.db');

// ---- query helpers (wrap sql.js into a simple sync API) ----

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

function run(sql, params = []) {
  db.run(sql, params);
  const lastId = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
  const changes = db.getRowsModified();
  return { lastInsertRowid: lastId, changes };
}

function save() {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// ---- public API ----

async function initDb(customPath) {
  dbPath = customPath || DB_FILE;

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      cover_url TEXT,
      total_pages INTEGER,
      current_page INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'want_to_read'
        CHECK(status IN ('want_to_read', 'reading', 'finished')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL UNIQUE,
      content TEXT NOT NULL,
      key_points TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  // ---- migration: add file_path / file_type columns if missing ----
  const cols = db.exec("PRAGMA table_info(books)");
  if (cols.length > 0) {
    const colNames = cols[0].values.map(row => row[1]); // column name is index 1
    if (!colNames.includes('file_path')) {
      db.run('ALTER TABLE books ADD COLUMN file_path TEXT');
    }
    if (!colNames.includes('file_type')) {
      db.run('ALTER TABLE books ADD COLUMN file_type TEXT');
    }
  }

  // ---- migration: add page_number column to notes if missing ----
  const noteCols = db.exec("PRAGMA table_info(notes)");
  if (noteCols.length > 0) {
    const noteColNames = noteCols[0].values.map(row => row[1]);
    if (!noteColNames.includes('page_number')) {
      db.run('ALTER TABLE notes ADD COLUMN page_number INTEGER');
    }
  }

  save();
  console.log(`[db] initialized at ${dbPath}`);
  return { queryAll, queryOne, run, save };
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return { queryAll, queryOne, run, save };
}

module.exports = { initDb, getDb, DB_FILE };
