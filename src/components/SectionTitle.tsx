import type { ReactNode } from 'react'

/**
 * Centered section header: a small line-flanked eyebrow label over a big
 * bold heading. Pass a colored <span> inside `heading` to highlight part
 * of it (e.g. text-brand).
 */
export default function SectionTitle({
  eyebrow,
  heading,
}: {
  eyebrow: string
  heading: ReactNode
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-4">
        <span className="h-px w-10 bg-line" aria-hidden="true" />
        <span className="text-xs font-semibold tracking-wider text-muted uppercase">
          {eyebrow}
        </span>
        <span className="h-px w-10 bg-line" aria-hidden="true" />
      </div>
      <h2 className="mt-3 text-3xl font-bold text-fg sm:text-4xl">{heading}</h2>
    </div>
  )
}
