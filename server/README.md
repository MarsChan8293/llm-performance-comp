# LLM Performance Comp Backend

This is a simple Express server to persist benchmark data in a PostgreSQL database.

## Setup

1.  **Install PostgreSQL**: Ensure you have PostgreSQL installed and running.
2.  **Create Database**:
    ```sql
    CREATE DATABASE llm_benchmarks;
    ```
3.  **Configure Environment**: Update `server/.env` with your database credentials.
4.  **Install Dependencies**:
    ```bash
    cd server
    npm install
    ```
5.  **Run Server**:
    ```bash
    npm run start
    ```
    Or from the root directory:
    ```bash
    npm run server
    ```

## API Endpoints

- `GET /api/benchmarks`: Fetch all benchmarks.
- `POST /api/benchmarks`: Add or update a benchmark.
- `DELETE /api/benchmarks/:id`: Delete a benchmark.
