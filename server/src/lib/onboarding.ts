import { getTable } from './sheet.js'
import { env } from '../env.js'

export type OnboardingDoc = {
  id: string // Drive file id
  name: string // prettified, extension stripped
  extension: string // "docx", "xlsx", "pdf", ... or "" if none
  viewUrl: string // Google's embeddable preview (iframe)
  downloadUrl: string
}

export class DriveAccessError extends Error {}

function prettifyName(fileName: string) {
  const withoutExt = fileName.replace(/\.[a-z0-9]{2,5}$/i, '')
  return withoutExt
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function extensionOf(fileName: string) {
  return fileName.match(/\.([a-z0-9]{2,5})$/i)?.[1].toLowerCase() ?? ''
}

/**
 * Google's folder-embed view: a plain server-rendered HTML listing meant for
 * iframe embeds, so it works for any publicly shared folder without an API
 * key. One `<div class="flip-entry" id="entry-{fileId}">…<span
 * class="flip-entry-title">{fileName}</span>…</div>` per file.
 */
async function fetchFolderHtml(folderId: string): Promise<string> {
  const res = await fetch(
    `https://drive.google.com/embeddedfolderview?id=${folderId}#list`,
    { signal: AbortSignal.timeout(10_000) },
  )
  if (!res.ok) {
    throw new DriveAccessError(
      'Cannot read the Drive folder. Share it as "Anyone with the link can view".',
    )
  }
  return res.text()
}

function parseFolderEntries(html: string): { id: string; name: string }[] {
  const blocks = html.split(/(?=<div class="flip-entry")/)
  const entries: { id: string; name: string }[] = []
  for (const block of blocks) {
    const id = block.match(/^<div class="flip-entry" id="entry-([^"]+)"/)?.[1]
    const name = block.match(/class="flip-entry-title"[^>]*>([^<]*)</)?.[1]
    if (id && name) entries.push({ id, name: name.trim() })
  }
  return entries
}

const FOLDER_TTL_MS = 60_000
let folderCache: { at: number; docs: OnboardingDoc[] } | null = null
let folderInflight: Promise<OnboardingDoc[]> | null = null

async function loadFolder(fresh: boolean): Promise<OnboardingDoc[]> {
  if (folderCache && Date.now() - folderCache.at < FOLDER_TTL_MS && !fresh) {
    return folderCache.docs
  }
  if (folderInflight) return folderInflight

  folderInflight = (async () => {
    const table = await getTable(env.ONBOARDING_SHEET_GID, true)
    const link = table[0]?.[0]?.trim() ?? ''
    const folderId = link.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1]
    if (!folderId) {
      throw new DriveAccessError(
        'No Drive folder link found. Add a Google Drive folder link to the "Onboarding list" sheet tab.',
      )
    }
    const html = await fetchFolderHtml(folderId)
    const entries = parseFolderEntries(html)
    if (entries.length === 0 && /accounts\.google\.com|ServiceLogin/.test(html)) {
      throw new DriveAccessError(
        'Cannot read the Drive folder. Share it as "Anyone with the link can view".',
      )
    }
    const docs: OnboardingDoc[] = entries
      .map((e) => ({
        id: e.id,
        name: prettifyName(e.name),
        extension: extensionOf(e.name),
        viewUrl: `https://drive.google.com/file/d/${e.id}/preview`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${e.id}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    folderCache = { at: Date.now(), docs }
    return docs
  })().finally(() => {
    folderInflight = null
  })
  return folderInflight
}

export async function getOnboardingDocs(fresh = false): Promise<OnboardingDoc[]> {
  return loadFolder(fresh)
}
