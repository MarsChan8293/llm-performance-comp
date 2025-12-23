# LLM Performance Comp Backend

This is a simple Express server to persist benchmark data in a SQLite database.

## Setup

1.  **Install Dependencies**:
    ```bash
    cd server
    npm install
    ```
2.  **Run Server**:
    ```bash
    npm run start
    ```
    Or from the root directory:
    ```bash
    npm run server
    ```

> **Important**: After updating the codebase (e.g., pulling changes, merging PRs, or switching branches), **always restart the server** to load the latest schema and validation rules. 
> 
> Common symptom of running outdated server code: validation errors like `"field_name" is not allowed` for fields that exist in the current schema. This indicates the server is using a cached or older version of the validation schema.

## API Endpoints (v1)

All endpoints are prefixed with \`/api/v1\`.

### Benchmarks

#### \`GET /api/v1/benchmarks\`
Fetch all benchmarks, ordered by creation date (descending).

#### \`GET /api/v1/benchmarks/:id\`
Fetch a single benchmark by ID.

#### \`POST /api/v1/benchmarks\`
Add or update a benchmark manually.
- **Body**: \`Benchmark\` object (JSON).
- **Validation**: Uses Joi to ensure \`config\` and \`metrics\` match the required schema.

#### \`POST /api/v1/benchmarks/upload\`
Upload a CSV file and its associated configuration.
- **Content-Type**: \`multipart/form-data\`
- **Fields**:
  - \`config\`: JSON string of the \`BenchmarkConfig\`.
  - \`file\`: The CSV file containing performance metrics.
- **CSV Format**: Must include headers: \`Process Num\`, \`Input Length\`, \`Output Length\`, \`TTFT (ms)\`, \`TPS (with prefill)\`. Optional: \`Total Time (ms)\`.

#### \`DELETE /api/v1/benchmarks/:id\`
Delete a benchmark by ID.

## Data Validation

The server uses \`joi\` to validate incoming data:
- **Config**: Ensures all required metadata (model, server, chip, etc.) is present.
- **Metrics**: Ensures all performance data (concurrency, lengths, TTFT, TPS) are valid numbers.

## CSV Parsing

CSV parsing is handled on the backend using \`csv-parse\`. The logic calculates \`TPOT\` (Time Per Output Token) if \`Total Time (ms)\` is provided.
