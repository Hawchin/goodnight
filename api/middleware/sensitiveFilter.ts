import { getAllSensitiveWords } from '../db.js'

export function containsSensitiveContent(text: string): boolean {
  if (!text) return false
  const words = getAllSensitiveWords()
  const lowerText = text.toLowerCase()
  for (const { word } of words) {
    if (lowerText.includes(word.toLowerCase())) {
      return true
    }
  }
  return false
}
