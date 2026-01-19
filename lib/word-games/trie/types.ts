/**
 * Types for Trie dictionary service
 */

export interface DictionarySource {
  path: string
  type: 'full' | 'common'
}

export interface DictionaryLoadResult {
  success: boolean
  wordCount?: number
  error?: string
}
