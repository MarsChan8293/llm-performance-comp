const { parse } = require('csv-parse/sync');
const Joi = require('joi');
const { mapHeaders, validateRequiredFields, StandardField } = require('./csv-header-mapper');

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

// Joi Schema for Comparison Reports
const reportSchema = Joi.object({
  id: Joi.string().optional(),
  benchmarkId1: Joi.string().required(),
  benchmarkId2: Joi.string().required(),
  modelName1: Joi.string().required(),
  modelName2: Joi.string().required(),
  summary: Joi.string().min(1).required(),
  createdAt: Joi.string().isoDate().optional(),
});

/**
 * Parses CSV content and returns an array of PerformanceMetrics
 * Supports multiple CSV formats with fuzzy header matching and unit conversion
 * @param {string} csvContent 
 * @returns {Array}
 */
function parseBenchmarkCSV(csvContent) {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (records.length === 0) {
    throw new Error('CSV file contains no valid data rows');
  }

  // Get headers from the first record
  const csvHeaders = Object.keys(records[0]);
  
  // Map headers to standard fields with fuzzy matching
  const headerMapping = mapHeaders(csvHeaders);
  
  // Validate that all required fields are present
  const missingFields = validateRequiredFields(headerMapping);
  if (missingFields.length > 0) {
    throw new Error(`CSV file is missing required columns: ${missingFields.join(', ')}`);
  }

  return records.map((record) => {
    // Extract values using mapped headers
    const processNumInfo = headerMapping.get(StandardField.PROCESS_NUM);
    const inputLengthInfo = headerMapping.get(StandardField.INPUT_LENGTH);
    const outputLengthInfo = headerMapping.get(StandardField.OUTPUT_LENGTH);
    const ttftInfo = headerMapping.get(StandardField.TTFT);
    const tpsInfo = headerMapping.get(StandardField.TPS);
    const totalTimeInfo = headerMapping.get(StandardField.TOTAL_TIME);
    
    // Safety check: ensure all required fields are present
    if (!processNumInfo || !inputLengthInfo || !outputLengthInfo || !ttftInfo || !tpsInfo) {
      throw new Error('Missing required field mapping');
    }
    
    const processNum = parseInt(record[processNumInfo.csvColumn]);
    const inputLength = parseInt(record[inputLengthInfo.csvColumn]);
    const outputLength = parseInt(record[outputLengthInfo.csvColumn]);
    let ttft = parseFloat(record[ttftInfo.csvColumn]);
    const tokensPerSecond = parseFloat(record[tpsInfo.csvColumn]);
    let totalTime = 0;
    
    // Apply unit conversion for TTFT if needed
    if (ttftInfo.conversionFactor !== 1) {
      ttft = ttft * ttftInfo.conversionFactor;
    }
    
    // Get total time with unit conversion if available
    if (totalTimeInfo) {
      const totalTimeValue = record[totalTimeInfo.csvColumn];
      if (totalTimeValue) {
        totalTime = parseFloat(totalTimeValue);
        if (totalTimeInfo.conversionFactor !== 1) {
          totalTime = totalTime * totalTimeInfo.conversionFactor;
        }
      }
    }

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
  reportSchema,
  parseBenchmarkCSV,
};
