/**
 * CSV Header Mapping and Fuzzy Matching Utilities
 * Supports multiple CSV formats with automatic header matching and unit conversion
 */

/**
 * Standard field names used internally
 */
export enum StandardField {
  PROCESS_NUM = 'processNum',
  INPUT_LENGTH = 'inputLength',
  OUTPUT_LENGTH = 'outputLength',
  TTFT = 'ttft',
  TPS = 'tps',
  TOTAL_TIME = 'totalTime',
}

/**
 * Header mapping configuration
 * Maps alternative header names to standard fields
 */
const HEADER_MAPPINGS: Record<StandardField, string[]> = {
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
}

/**
 * Unit conversion configuration
 * Defines which headers need unit conversion and the conversion factor
 */
interface UnitConversion {
  /** Headers that contain this unit identifier (case-insensitive) */
  identifiers: string[]
  /** Multiply by this factor to convert to target unit (milliseconds) */
  factor: number
  /** Description of the conversion */
  description: string
}

const UNIT_CONVERSIONS: UnitConversion[] = [
  {
    // Only match standalone seconds, not rates like tok/s
    identifiers: ['duration (s)', 'duration(s)', 'time (s)', 'time(s)'],
    factor: 1000, // seconds to milliseconds
    description: 'seconds to milliseconds',
  },
]

/**
 * Normalizes a header string for comparison
 * Removes extra spaces, special characters, and converts to lowercase
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters except word chars and spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim()
}

/**
 * Checks if a value needs unit conversion based on the original header
 */
function needsUnitConversion(originalHeader: string): number {
  const lower = originalHeader.toLowerCase()
  
  // Check for seconds (but not milliseconds)
  // Must not contain 'ms' or 'millisecond'
  if (!lower.includes('ms') && !lower.includes('millisecond')) {
    for (const conversion of UNIT_CONVERSIONS) {
      for (const identifier of conversion.identifiers) {
        const normalizedId = identifier.toLowerCase()
        if (lower.includes(normalizedId)) {
          return conversion.factor
        }
      }
    }
  }
  
  return 1 // No conversion needed
}

/**
 * Finds the best matching standard field for a given CSV header
 * Returns null if no match is found
 */
export function matchHeaderToField(csvHeader: string): {
  field: StandardField
  originalHeader: string
  conversionFactor: number
} | null {
  const normalized = normalizeHeader(csvHeader)
  
  // Try exact match first (after normalization)
  for (const [field, patterns] of Object.entries(HEADER_MAPPINGS)) {
    for (const pattern of patterns) {
      if (normalizeHeader(pattern) === normalized) {
        return {
          field: field as StandardField,
          originalHeader: csvHeader,
          conversionFactor: needsUnitConversion(csvHeader),
        }
      }
    }
  }
  
  // Try partial match (contains)
  for (const [field, patterns] of Object.entries(HEADER_MAPPINGS)) {
    for (const pattern of patterns) {
      const normalizedPattern = normalizeHeader(pattern)
      if (normalized.includes(normalizedPattern) || normalizedPattern.includes(normalized)) {
        return {
          field: field as StandardField,
          originalHeader: csvHeader,
          conversionFactor: needsUnitConversion(csvHeader),
        }
      }
    }
  }
  
  return null
}

/**
 * Maps CSV headers to standard field names
 * Returns a mapping of standard field names to CSV column names
 */
export function mapHeaders(csvHeaders: string[]): Map<StandardField, {
  csvColumn: string
  conversionFactor: number
}> {
  const mapping = new Map<StandardField, { csvColumn: string; conversionFactor: number }>()
  
  for (const header of csvHeaders) {
    const match = matchHeaderToField(header)
    if (match) {
      // Only keep the first match for each field
      if (!mapping.has(match.field)) {
        mapping.set(match.field, {
          csvColumn: match.originalHeader,
          conversionFactor: match.conversionFactor,
        })
      }
    }
  }
  
  return mapping
}

/**
 * Validates that all required fields are present in the mapping
 */
export function validateRequiredFields(mapping: Map<StandardField, any>): string[] {
  const required = [
    StandardField.PROCESS_NUM,
    StandardField.INPUT_LENGTH,
    StandardField.OUTPUT_LENGTH,
    StandardField.TTFT,
    StandardField.TPS,
  ]
  
  const missing: string[] = []
  
  for (const field of required) {
    if (!mapping.has(field)) {
      // Get friendly name for error message
      const friendlyNames: Record<StandardField, string> = {
        [StandardField.PROCESS_NUM]: 'Process Num / parallel / concurrency',
        [StandardField.INPUT_LENGTH]: 'Input Length / input',
        [StandardField.OUTPUT_LENGTH]: 'Output Length / output',
        [StandardField.TTFT]: 'TTFT (ms) / Mean TTFT',
        [StandardField.TPS]: 'TPS (with prefill) / output throughput',
        [StandardField.TOTAL_TIME]: 'Total Time (ms) / duration',
      }
      missing.push(friendlyNames[field] || field)
    }
  }
  
  return missing
}
