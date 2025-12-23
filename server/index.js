const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { configSchema, metricsSchema, reportSchema, parseBenchmarkCSV } = require('./utils');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app
const distPath = path.join(__dirname, '../dist');
if (require('fs').existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log(`Serving static files from ${distPath}`);
}

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// SQLite Connection
const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'benchmarks.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log(`Connected to the SQLite database at ${dbPath}.`);
    initDb();
  }
});

// Initialize Database Table
const initDb = () => {
  const benchmarkQuery = `
    CREATE TABLE IF NOT EXISTS benchmarks (
      id TEXT PRIMARY KEY,
      config TEXT NOT NULL,
      metrics TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.serialize(() => {
    db.run(benchmarkQuery, (err) => {
      if (err) console.error('Error initializing benchmarks table:', err.message);
      else console.log('Benchmarks table initialized');
    });

    const reportQuery = `
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        benchmark_id1 TEXT NOT NULL,
        benchmark_id2 TEXT NOT NULL,
        model_name1 TEXT NOT NULL,
        model_name2 TEXT NOT NULL,
        summary TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    db.run(reportQuery, (err) => {
      if (err) console.error('Error initializing reports table:', err.message);
      else console.log('Reports table initialized');
    });
  });
};

// API Routes (v1)

// Get all benchmarks
app.get('/api/v1/benchmarks', (req, res) => {
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

// Get a single benchmark
app.get('/api/v1/benchmarks/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM benchmarks WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Benchmark not found' });
    }
    res.json({
      id: row.id,
      config: JSON.parse(row.config),
      metrics: JSON.parse(row.metrics),
      createdAt: row.created_at
    });
  });
});

// Add or update a benchmark (Manual Entry)
app.post('/api/v1/benchmarks', (req, res) => {
  const { id, config, metrics, createdAt } = req.body;
  
  // Validate config
  const { error: configError } = configSchema.validate(config);
  if (configError) return res.status(400).json({ error: `Invalid config: ${configError.message}` });

  // Validate metrics (array of metrics)
  if (!Array.isArray(metrics)) return res.status(400).json({ error: 'Metrics must be an array' });
  for (const m of metrics) {
    const { error: mError } = metricsSchema.validate(m);
    if (mError) return res.status(400).json({ error: `Invalid metric entry: ${mError.message}` });
  }

  const benchmarkId = id || uuidv4();
  const queryText = `
    /* Upsert benchmark: insert new or update config/metrics if ID exists */
    INSERT INTO benchmarks(id, config, metrics, created_at) 
    VALUES(?, ?, ?, ?) 
    ON CONFLICT(id) DO UPDATE SET config=excluded.config, metrics=excluded.metrics
  `;
  const values = [benchmarkId, JSON.stringify(config), JSON.stringify(metrics), createdAt || new Date().toISOString()];

  db.run(queryText, values, function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(201).json({ id: benchmarkId, config, metrics, createdAt: values[3] });
  });
});

// Upload CSV and Config
app.post('/api/v1/benchmarks/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });
    if (!req.body.config) return res.status(400).json({ error: 'No config provided' });

    const config = JSON.parse(req.body.config);
    const { error: configError } = configSchema.validate(config);
    if (configError) return res.status(400).json({ error: `Invalid config: ${configError.message}` });

    const csvContent = req.file.buffer.toString('utf-8');
    const metrics = parseBenchmarkCSV(csvContent);

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const queryText = 'INSERT INTO benchmarks(id, config, metrics, created_at) VALUES(?, ?, ?, ?)';
    const values = [id, JSON.stringify(config), JSON.stringify(metrics), createdAt];

    db.run(queryText, values, function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(201).json({ id, config, metrics, createdAt });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete a benchmark
app.delete('/api/v1/benchmarks/:id', (req, res) => {
  const { id } = req.params;
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    db.run('DELETE FROM benchmarks WHERE id = ?', id, function(err) {
      if (err) {
        console.error(err.message);
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Cascade delete reports associated with this benchmark
      db.run('DELETE FROM reports WHERE benchmark_id1 = ? OR benchmark_id2 = ?', [id, id], (err) => {
        if (err) {
          console.error('Error deleting associated reports:', err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
          }
          res.status(204).send();
        });
      });
    });
  });
});

// --- Reports API ---

// Get all reports
app.get('/api/v1/reports', (req, res) => {
  db.all('SELECT * FROM reports ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    const reports = rows.map(row => ({
      id: row.id,
      benchmarkId1: row.benchmark_id1,
      benchmarkId2: row.benchmark_id2,
      modelName1: row.model_name1,
      modelName2: row.model_name2,
      summary: row.summary,
      createdAt: row.created_at
    }));
    res.json(reports);
  });
});

// Add or update a report
app.post('/api/v1/reports', (req, res) => {
  const { error, value } = reportSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { id, benchmarkId1, benchmarkId2, modelName1, modelName2, summary, createdAt } = value;
  
  const reportId = id || uuidv4();
  const reportCreatedAt = createdAt || new Date().toISOString();
  
  const queryText = `
    /* Upsert report: insert new or update summary if ID exists */
    INSERT INTO reports(id, benchmark_id1, benchmark_id2, model_name1, model_name2, summary, created_at) 
    VALUES(?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET 
      summary=excluded.summary,
      created_at=excluded.created_at
  `;
  const values = [reportId, benchmarkId1, benchmarkId2, modelName1, modelName2, summary, reportCreatedAt];

  db.run(queryText, values, function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(201).json({ 
      id: reportId, 
      benchmarkId1, 
      benchmarkId2, 
      modelName1, 
      modelName2, 
      summary, 
      createdAt: reportCreatedAt 
    });
  });
});

// Delete a report
app.delete('/api/v1/reports/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM reports WHERE id = ?', id, function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(204).send();
  });
});

// Backward compatibility for old routes (optional, but good practice)
app.get('/api/benchmarks', (req, res) => res.redirect(301, '/api/v1/benchmarks'));
app.post('/api/benchmarks', (req, res) => res.redirect(307, '/api/v1/benchmarks'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
