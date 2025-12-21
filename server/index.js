const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite Connection
const dbPath = path.resolve(__dirname, 'benchmarks.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

// Initialize Database Table
const initDb = () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS benchmarks (
      id TEXT PRIMARY KEY,
      config TEXT NOT NULL,
      metrics TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  db.run(queryText, (err) => {
    if (err) {
      console.error('Error initializing database:', err.message);
    } else {
      console.log('Database table initialized');
    }
  });
};

// API Routes

// Get all benchmarks
app.get('/api/benchmarks', (req, res) => {
  db.all('SELECT * FROM benchmarks ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    const benchmarks = rows.map(row => ({
      id: row.id,
      config: JSON.parse(row.config),
      metrics: JSON.parse(row.metrics),
      createdAt: row.created_at
    }));
    res.json(benchmarks);
  });
});

// Add a new benchmark
app.post('/api/benchmarks', (req, res) => {
  const { id, config, metrics, createdAt } = req.body;
  const queryText = 'INSERT INTO benchmarks(id, config, metrics, created_at) VALUES(?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET config=excluded.config, metrics=excluded.metrics';
  const values = [id, JSON.stringify(config), JSON.stringify(metrics), createdAt || new Date().toISOString()];
  
  db.run(queryText, values, function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(201).json({ id, config, metrics, createdAt: values[3] });
  });
});

// Delete a benchmark
app.delete('/api/benchmarks/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM benchmarks WHERE id = ?', id, function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(204).send();
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
