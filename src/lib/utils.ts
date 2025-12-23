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
  // Generate human-readable timestamp in format YYYYMMDDHHmmss
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`
  
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const randomValues = new Uint8Array(6)
  crypto.getRandomValues(randomValues)
  let randomPart = ''
  for (let i = 0; i < 6; i++) {
    randomPart += characters.charAt(randomValues[i] % characters.length)
  }
  return `${prefix}-${timestamp}-${randomPart}`
}
