const { parse } = require('csv-parse/sync');
const Joi = require('joi');

// Joi Schema for BenchmarkConfig (matching src/lib/types.ts)
const configSchema = Joi.object({
  modelName: Joi.string().required(),
  serverName: Joi.string().required(),
  shardingConfig: Joi.string().required(),
  chipName: Joi.string().required(),
  framework: Joi.string().required(),
  frameworkParams: Joi.string().allow('').required(),
  testDate: Joi.string().isoDate().required(),
  submitter: Joi.string().allow('').optional(),
  operatorAcceleration: Joi.string().allow('').optional(),
  notes: Joi.string().allow('').optional(),
});

// Joi Schema for PerformanceMetrics (matching src/lib/types.ts)
const metricsSchema = Joi.object({
  inputLength: Joi.number().integer().min(0).required(),
  outputLength: Joi.number().integer().min(0).required(),
  concurrency: Joi.number().integer().min(1).required(),
  ttft: Joi.number().min(0).required(),
  tpot: Joi.number().min(0).required(),
  tokensPerSecond: Joi.number().min(0).required(),
});

/**
 * Parses CSV content and returns an array of PerformanceMetrics
 * @param {string} csvContent 
 * @returns {Array}
 */
function parseBenchmarkCSV(csvContent) {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((record) => {
    const processNum = parseInt(record['Process Num']);
    const inputLength = parseInt(record['Input Length']);
    const outputLength = parseInt(record['Output Length']);
    const ttft = parseFloat(record['TTFT (ms)']);
    const tokensPerSecond = parseFloat(record['TPS (with prefill)']);
    const totalTime = record['Total Time (ms)'] ? parseFloat(record['Total Time (ms)']) : 0;

    if (isNaN(processNum) || isNaN(inputLength) || isNaN(outputLength) || isNaN(ttft) || isNaN(tokensPerSecond)) {
      throw new Error('CSV contains invalid numeric data');
    }

    const tpot = totalTime > 0 && outputLength > 0 
      ? (totalTime - ttft) / outputLength 
      : 0;

    const metrics = {
      inputLength,
      outputLength,
      concurrency: processNum,
      ttft,
      tpot: parseFloat(tpot.toFixed(4)),
      tokensPerSecond: parseFloat(tokensPerSecond.toFixed(4)),
    };

    // Validate each metric entry
    const { error } = metricsSchema.validate(metrics);
    if (error) {
      throw new Error(`Validation error in CSV row: ${error.message}`);
    }

    return metrics;
  });
}

module.exports = {
  configSchema,
  metricsSchema,
  parseBenchmarkCSV,
};
