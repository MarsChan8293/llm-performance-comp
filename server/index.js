const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { configSchema, metricsSchema, reportSchema, parseBenchmarkCSV, generateUniqueId } = require('./utils');
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
      unique_id TEXT UNIQUE,
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

    // Check if unique_id column exists and add it if it doesn't (migration)
    db.all("PRAGMA table_info(benchmarks)", [], (err, columns) => {
      if (err) {
        console.error('Error checking benchmarks table structure:', err.message);
        return;
      }
      
      const hasUniqueId = columns.some(col => col.name === 'unique_id');
      
      if (!hasUniqueId) {
        db.run('ALTER TABLE benchmarks ADD COLUMN unique_id TEXT', (err) => {
          if (err) {
            console.error('Error adding unique_id column to benchmarks:', err.message);
            return;
          }
          console.log('Added unique_id column to benchmarks table');
        });
      }
      
      // Generate unique IDs for existing records without them
      db.all('SELECT id FROM benchmarks WHERE unique_id IS NULL', [], (err, rows) => {
        if (err) {
          console.error('Error selecting benchmarks without unique_id:', err.message);
        } else if (rows && rows.length > 0) {
          console.log(`Generating unique IDs for ${rows.length} existing benchmarks...`);
          rows.forEach(row => {
            const uniqueId = generateUniqueId('BM');
            db.run('UPDATE benchmarks SET unique_id = ? WHERE id = ?', [uniqueId, row.id], (err) => {
              if (err) console.error('Error updating benchmark unique_id:', err.message);
            });
          });
        }
      });
    });

    const reportQuery = `
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        unique_id TEXT UNIQUE,
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

    // Check if unique_id column exists and add it if it doesn't (migration)
    db.all("PRAGMA table_info(reports)", [], (err, columns) => {
      if (err) {
        console.error('Error checking reports table structure:', err.message);
        return;
      }
      
      const hasUniqueId = columns.some(col => col.name === 'unique_id');
      
      if (!hasUniqueId) {
        db.run('ALTER TABLE reports ADD COLUMN unique_id TEXT', (err) => {
          if (err) {
            console.error('Error adding unique_id column to reports:', err.message);
            return;
          }
          console.log('Added unique_id column to reports table');
        });
      }
      
      // Generate unique IDs for existing records without them
      db.all('SELECT id FROM reports WHERE unique_id IS NULL', [], (err, rows) => {
        if (err) {
          console.error('Error selecting reports without unique_id:', err.message);
        } else if (rows && rows.length > 0) {
          console.log(`Generating unique IDs for ${rows.length} existing reports...`);
          rows.forEach(row => {
            const uniqueId = generateUniqueId('RP');
            db.run('UPDATE reports SET unique_id = ? WHERE id = ?', [uniqueId, row.id], (err) => {
              if (err) console.error('Error updating report unique_id:', err.message);
            });
          });
        }
      });
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
      uniqueId: row.unique_id,
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
      uniqueId: row.unique_id,
      config: JSON.parse(row.config),
      metrics: JSON.parse(row.metrics),
      createdAt: row.created_at
    });
  });
});

// Add or update a benchmark (Manual Entry)
app.post('/api/v1/benchmarks', (req, res) => {
  const { id, uniqueId, config, metrics, createdAt } = req.body;
  
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
  
  // Check if this is an update (id provided) and fetch existing unique_id
  if (id) {
    db.get('SELECT unique_id FROM benchmarks WHERE id = ?', [id], (err, row) => {
      const benchmarkUniqueId = (row && row.unique_id) || uniqueId || generateUniqueId('BM');
      const queryText = `
        /* Upsert benchmark: insert new or update config/metrics if ID exists */
        INSERT INTO benchmarks(id, unique_id, config, metrics, created_at) 
        VALUES(?, ?, ?, ?, ?) 
        ON CONFLICT(id) DO UPDATE SET config=excluded.config, metrics=excluded.metrics, unique_id=excluded.unique_id
      `;
      const values = [benchmarkId, benchmarkUniqueId, JSON.stringify(config), JSON.stringify(metrics), createdAt || new Date().toISOString()];

      db.run(queryText, values, function(err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(201).json({ id: benchmarkId, uniqueId: benchmarkUniqueId, config, metrics, createdAt: values[4] });
      });
    });
  } else {
    const benchmarkUniqueId = uniqueId || generateUniqueId('BM');
    const queryText = `
      /* Upsert benchmark: insert new or update config/metrics if ID exists */
      INSERT INTO benchmarks(id, unique_id, config, metrics, created_at) 
      VALUES(?, ?, ?, ?, ?) 
      ON CONFLICT(id) DO UPDATE SET config=excluded.config, metrics=excluded.metrics, unique_id=excluded.unique_id
    `;
    const values = [benchmarkId, benchmarkUniqueId, JSON.stringify(config), JSON.stringify(metrics), createdAt || new Date().toISOString()];

    db.run(queryText, values, function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(201).json({ id: benchmarkId, uniqueId: benchmarkUniqueId, config, metrics, createdAt: values[4] });
    });
  }
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
    const uniqueId = generateUniqueId('BM');
    const createdAt = new Date().toISOString();
    const queryText = 'INSERT INTO benchmarks(id, unique_id, config, metrics, created_at) VALUES(?, ?, ?, ?, ?)';
    const values = [id, uniqueId, JSON.stringify(config), JSON.stringify(metrics), createdAt];

    db.run(queryText, values, function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(201).json({ id, uniqueId, config, metrics, createdAt });
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
      uniqueId: row.unique_id,
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

  const { id, uniqueId, benchmarkId1, benchmarkId2, modelName1, modelName2, summary, createdAt } = value;
  
  const reportId = id || uuidv4();
  const reportCreatedAt = createdAt || new Date().toISOString();
  
  // Check if this is an update (id provided) and fetch existing unique_id
  if (id) {
    db.get('SELECT unique_id FROM reports WHERE id = ?', [id], (err, row) => {
      const reportUniqueId = (row && row.unique_id) || uniqueId || generateUniqueId('RP');
      const queryText = `
        /* Upsert report: insert new or update summary if ID exists */
        INSERT INTO reports(id, unique_id, benchmark_id1, benchmark_id2, model_name1, model_name2, summary, created_at) 
        VALUES(?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET 
          summary=excluded.summary,
          created_at=excluded.created_at,
          unique_id=excluded.unique_id
      `;
      const values = [reportId, reportUniqueId, benchmarkId1, benchmarkId2, modelName1, modelName2, summary, reportCreatedAt];

      db.run(queryText, values, function(err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(201).json({ 
          id: reportId,
          uniqueId: reportUniqueId,
          benchmarkId1, 
          benchmarkId2, 
          modelName1, 
          modelName2, 
          summary, 
          createdAt: reportCreatedAt 
        });
      });
    });
  } else {
    const reportUniqueId = uniqueId || generateUniqueId('RP');
    const queryText = `
      /* Upsert report: insert new or update summary if ID exists */
      INSERT INTO reports(id, unique_id, benchmark_id1, benchmark_id2, model_name1, model_name2, summary, created_at) 
      VALUES(?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        summary=excluded.summary,
        created_at=excluded.created_at,
        unique_id=excluded.unique_id
    `;
    const values = [reportId, reportUniqueId, benchmarkId1, benchmarkId2, modelName1, modelName2, summary, reportCreatedAt];

    db.run(queryText, values, function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(201).json({ 
        id: reportId,
        uniqueId: reportUniqueId,
        benchmarkId1, 
        benchmarkId2, 
        modelName1, 
        modelName2, 
        summary, 
        createdAt: reportCreatedAt 
      });
    });
  }
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

// Search by unique ID
app.get('/api/v1/search/:uniqueId', (req, res) => {
  const { uniqueId } = req.params;
  
  // Search in benchmarks
  db.get('SELECT * FROM benchmarks WHERE unique_id = ?', [uniqueId], (err, benchmarkRow) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (benchmarkRow) {
      return res.json({
        type: 'benchmark',
        data: {
          id: benchmarkRow.id,
          uniqueId: benchmarkRow.unique_id,
          config: JSON.parse(benchmarkRow.config),
          metrics: JSON.parse(benchmarkRow.metrics),
          createdAt: benchmarkRow.created_at
        }
      });
    }
    
    // Search in reports
    db.get('SELECT * FROM reports WHERE unique_id = ?', [uniqueId], (err, reportRow) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (reportRow) {
        return res.json({
          type: 'report',
          data: {
            id: reportRow.id,
            uniqueId: reportRow.unique_id,
            benchmarkId1: reportRow.benchmark_id1,
            benchmarkId2: reportRow.benchmark_id2,
            modelName1: reportRow.model_name1,
            modelName2: reportRow.model_name2,
            summary: reportRow.summary,
            createdAt: reportRow.created_at
          }
        });
      }
      
      return res.status(404).json({ error: 'No benchmark or report found with this unique ID' });
    });
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
