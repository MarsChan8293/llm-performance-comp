/**
 * CSV Header Mapping and Fuzzy Matching Utilities (Node.js)
 * Supports multiple CSV formats with automatic header matching and unit conversion
 */

/**
 * Standard field names used internally
 */
const StandardField = {
  PROCESS_NUM: 'processNum',
  INPUT_LENGTH: 'inputLength',
  OUTPUT_LENGTH: 'outputLength',
  TTFT: 'ttft',
  TPS: 'tps',
  TOTAL_TIME: 'totalTime',
};

/**
 * Header mapping configuration
 * Maps alternative header names to standard fields
 */
const HEADER_MAPPINGS = {
  [StandardField.PROCESS_NUM]: [
    'Process Num',
    'ProcessNum',
    'process num',
    'parallel',
    'concurrency',
  ],
  [StandardField.INPUT_LENGTH]: [
    'Input Length',
    'InputLength',
    'input length',
    'input',
    'total input',
  ],
  [StandardField.OUTPUT_LENGTH]: [
    'Output Length',
    'OutputLength',
    'output length',
    'output',
    'total output',
  ],
  [StandardField.TTFT]: [
    'TTFT (ms)',
    'TTFT(ms)',
    'ttft ms',
    'ttft',
    'Mean TTFT (ms)',
    'Mean TTFT',
    'mean ttft',
  ],
  [StandardField.TPS]: [
    'TPS (with prefill)',
    'TPS(with prefill)',
    'avg TPS (with prefill)',
    'tps with prefill',
    'tps',
    'output throughput (tok/s)',
    'output throughput',
    'throughput',
  ],
  [StandardField.TOTAL_TIME]: [
    'Total Time (ms)',
    'TotalTime(ms)',
    'total time ms',
    'total time',
    'duration (s)',
    'duration(s)',
    'duration',
  ],
};

/**
 * Unit conversion configuration
 */
const UNIT_CONVERSIONS = [
  {
    identifiers: ['(s)', 's)', 'seconds', 'sec'],
    factor: 1000, // seconds to milliseconds
    description: 'seconds to milliseconds',
  },
];

/**
 * Normalizes a header string for comparison
 * Removes extra spaces, special characters, and converts to lowercase
 */
function normalizeHeader(header) {
  return header
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters except word chars and spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
}

/**
 * Checks if a value needs unit conversion based on the original header
 */
function needsUnitConversion(originalHeader) {
  const normalized = normalizeHeader(originalHeader);
  
  for (const conversion of UNIT_CONVERSIONS) {
    for (const identifier of conversion.identifiers) {
      if (normalized.includes(normalizeHeader(identifier))) {
        return conversion.factor;
      }
    }
  }
  
  return 1; // No conversion needed
}

/**
 * Finds the best matching standard field for a given CSV header
 * Returns null if no match is found
 */
function matchHeaderToField(csvHeader) {
  const normalized = normalizeHeader(csvHeader);
  
  // Try exact match first (after normalization)
  for (const [field, patterns] of Object.entries(HEADER_MAPPINGS)) {
    for (const pattern of patterns) {
      if (normalizeHeader(pattern) === normalized) {
        return {
          field,
          originalHeader: csvHeader,
          conversionFactor: needsUnitConversion(csvHeader),
        };
      }
    }
  }
  
  // Try partial match (contains)
  for (const [field, patterns] of Object.entries(HEADER_MAPPINGS)) {
    for (const pattern of patterns) {
      const normalizedPattern = normalizeHeader(pattern);
      if (normalized.includes(normalizedPattern) || normalizedPattern.includes(normalized)) {
        return {
          field,
          originalHeader: csvHeader,
          conversionFactor: needsUnitConversion(csvHeader),
        };
      }
    }
  }
  
  return null;
}

/**
 * Maps CSV headers to standard field names
 * Returns a Map of standard field names to CSV column info
 */
function mapHeaders(csvHeaders) {
  const mapping = new Map();
  
  for (const header of csvHeaders) {
    const match = matchHeaderToField(header);
    if (match) {
      // Only keep the first match for each field
      if (!mapping.has(match.field)) {
        mapping.set(match.field, {
          csvColumn: match.originalHeader,
          conversionFactor: match.conversionFactor,
        });
      }
    }
  }
  
  return mapping;
}

/**
 * Validates that all required fields are present in the mapping
 */
function validateRequiredFields(mapping) {
  const required = [
    StandardField.PROCESS_NUM,
    StandardField.INPUT_LENGTH,
    StandardField.OUTPUT_LENGTH,
    StandardField.TTFT,
    StandardField.TPS,
  ];
  
  const missing = [];
  
  const friendlyNames = {
    [StandardField.PROCESS_NUM]: 'Process Num / parallel / concurrency',
    [StandardField.INPUT_LENGTH]: 'Input Length / input',
    [StandardField.OUTPUT_LENGTH]: 'Output Length / output',
    [StandardField.TTFT]: 'TTFT (ms) / Mean TTFT',
    [StandardField.TPS]: 'TPS (with prefill) / output throughput',
    [StandardField.TOTAL_TIME]: 'Total Time (ms) / duration',
  };
  
  for (const field of required) {
    if (!mapping.has(field)) {
      missing.push(friendlyNames[field] || field);
    }
  }
  
  return missing;
}

module.exports = {
  StandardField,
  mapHeaders,
  validateRequiredFields,
};
