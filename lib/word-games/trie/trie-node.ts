/**
 * TrieNode - Basic node in the Trie data structure
 * Uses Map for O(1) character lookups
 */
export class TrieNode {
  children: Map<string, TrieNode> = new Map()
  isWord: boolean = false
  isCommon: boolean = false // Tag for Wordle/Wordscape filtering
}
