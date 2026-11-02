import { env } from '../env.js'
import { getTable } from './sheet.js'

/** The "Resume prompt" tab: the whole prompt lives in cell A1. */
export async function getResumePrompt(fresh = false): Promise<string> {
  const table = await getTable(env.RESUME_PROMPT_SHEET_GID, fresh)
  return (table[0]?.[0] ?? '').trim()
}
