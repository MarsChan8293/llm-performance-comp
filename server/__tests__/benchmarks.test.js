const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const request = require('supertest');

const serverPath = path.resolve(__dirname, '..');

const baseConfig = {
  modelName: 'TestModel',
  serverName: 'TestServer',
  shardingConfig: 'TestNet',
  chipName: 'TestChip',
  framework: 'TestFW',
  frameworkParams: 'fp16',
  testDate: new Date().toISOString(),
  notes: 'note',
};

const baseMetrics = [
  {
    inputLength: 128,
    outputLength: 64,
    concurrency: 2,
    ttft: 10.5,
    tpot: 0.5,
    tokensPerSecond: 20.25,
  },
];

async function startServer(port) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['index.js'], {
      cwd: serverPath,
      env: { ...process.env, PORT: port, DB_PATH: ':memory:' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Server start timeout'));
    }, 5000);

    child.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('Server running on port')) {
        clearTimeout(timer);
        resolve(child);
      }
    });

    child.stderr.on('data', (data) => {
      console.error('server stderr:', data.toString());
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        clearTimeout(timer);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });
}

describe('REST API v1 (with in-memory SQLite)', () => {
  let server;
  let api;
  let port;

  beforeEach(async () => {
    port = 4000 + Math.floor(Math.random() * 1000);
    server = await startServer(port);
    api = request(`http://localhost:${port}`);
  });

  afterEach(() => {
    if (server && !server.killed) {
      server.kill();
    }
  });

  test('creates and fetches a benchmark', async () => {
    const postRes = await api
      .post('/api/v1/benchmarks')
      .send({ config: baseConfig, metrics: baseMetrics })
      .expect(201);

    expect(postRes.body.id).toBeDefined();

    const listRes = await api.get('/api/v1/benchmarks').expect(200);
    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0].id).toBe(postRes.body.id);

    const getRes = await api.get(`/api/v1/benchmarks/${postRes.body.id}`).expect(200);
    expect(getRes.body.config.modelName).toBe(baseConfig.modelName);
  });

  test('rejects invalid config', async () => {
    const badConfig = { ...baseConfig };
    delete badConfig.modelName;

    const res = await api
      .post('/api/v1/benchmarks')
      .send({ config: badConfig, metrics: baseMetrics })
      .expect(400);

    expect(res.body.error).toMatch(/Invalid config/);
  });

  test('uploads CSV and computes TPOT', async () => {
    const csv = [
      'Process Num,Input Length,Output Length,TTFT (ms),TPS (with prefill),Total Time (ms)',
      '1,100,50,20,10,120',
    ].join('\n');

    const res = await api
      .post('/api/v1/benchmarks/upload')
      .field('config', JSON.stringify(baseConfig))
      .attach('file', Buffer.from(csv), 'bench.csv')
      .expect(201);

    expect(res.body.metrics[0].tpot).toBeCloseTo(2, 4);
    expect(res.body.metrics[0].tokensPerSecond).toBeCloseTo(10, 4);

    const listRes = await api.get('/api/v1/benchmarks').expect(200);
    expect(listRes.body.length).toBe(1);
  });

  test('uploads multi-row CSV fixture and returns all metrics', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'bench-sample.csv');
    const csvBuffer = fs.readFileSync(fixturePath);

    const res = await api
      .post('/api/v1/benchmarks/upload')
      .field('config', JSON.stringify(baseConfig))
      .attach('file', csvBuffer, 'bench-sample.csv')
      .expect(201);

    expect(res.body.metrics).toHaveLength(3);
    expect(res.body.metrics[0].tokensPerSecond).toBeCloseTo(42.75, 4);
    expect(res.body.metrics[1].tpot).toBeCloseTo((340 - 25) / 256, 4);
  });

  test('tpot is zero when Total Time is missing', async () => {
    const csvNoTotal = [
      'Process Num,Input Length,Output Length,TTFT (ms),TPS (with prefill)',
      '1,64,32,8.5,15.5',
    ].join('\n');

    const res = await api
      .post('/api/v1/benchmarks/upload')
      .field('config', JSON.stringify(baseConfig))
      .attach('file', Buffer.from(csvNoTotal), 'bench-no-total.csv')
      .expect(201);

    expect(res.body.metrics[0].tpot).toBeCloseTo(0, 4);
  });

  test('rejects invalid CSV numeric fields', async () => {
    const badCsv = [
      'Process Num,Input Length,Output Length,TTFT (ms),TPS (with prefill)',
      '1,100,50,20,notANumber',
    ].join('\n');

    const res = await api
      .post('/api/v1/benchmarks/upload')
      .field('config', JSON.stringify(baseConfig))
      .attach('file', Buffer.from(badCsv), 'bad.csv')
      .expect(400);

    expect(res.body.error).toMatch(/CSV/);
  });

  test('deletes a benchmark', async () => {
    const postRes = await api
      .post('/api/v1/benchmarks')
      .send({ config: baseConfig, metrics: baseMetrics })
      .expect(201);

    await api.delete(`/api/v1/benchmarks/${postRes.body.id}`).expect(204);
    await api.get(`/api/v1/benchmarks/${postRes.body.id}`).expect(404);
  });
});
