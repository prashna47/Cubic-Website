/**
 * Fixed, full-viewport black backdrop with a few soft white blobs that drift
 * very slowly. Purely decorative. Styles live in index.css (`.landing-bg`).
 */
export default function LandingBackground() {
  return (
    <div className="landing-bg" aria-hidden="true">
      <span className="landing-blob landing-blob-1" />
      <span className="landing-blob landing-blob-2" />
      <span className="landing-blob landing-blob-3" />
    </div>
  )
}
