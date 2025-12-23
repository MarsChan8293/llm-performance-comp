import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses the number of GPUs from a network configuration string.
 * Examples:
 * - "TP4" -> 4
 * - "PP2" -> 2
 * - "2P2D" -> 4 (2 * 2)
 * - "8xH100" -> 8
 * - "TP16" -> 16
 */
export function parseGpuCount(shardingConfig: string): number {
  if (!shardingConfig) return 1

  const config = shardingConfig.toUpperCase()

  // Match xPyD format (e.g., 2P2D)
  const mixedMatch = config.match(/(\d+)P(\d+)D/)
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) * parseInt(mixedMatch[2])
  }

  // Match TPx or PPx format (e.g., TP4, PP2)
  const tpPpMatch = config.match(/(?:TP|PP)(\d+)/)
  if (tpPpMatch) {
    return parseInt(tpPpMatch[1])
  }

  // Match nx format (e.g., 8xH100)
  const multiplierMatch = config.match(/(\d+)X/)
  if (multiplierMatch) {
    return parseInt(multiplierMatch[1])
  }

  // Match "n卡" or "n GPUs"
  const chineseMatch = config.match(/(\d+)\s*(?:卡|GPU)/)
  if (chineseMatch) {
    return parseInt(chineseMatch[1])
  }

  return 1
}

/**
 * Generates a unique ID with format: PREFIX-TIMESTAMP-RANDOM6
 * @param prefix - "BM" for benchmarks, "RP" for reports
 * @returns Unique ID
 */
export function generateUniqueId(prefix: 'BM' | 'RP'): string {
  const timestamp = Date.now().toString()
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let randomPart = ''
  for (let i = 0; i < 6; i++) {
    randomPart += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return `${prefix}-${timestamp}-${randomPart}`
}
