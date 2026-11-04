/** Only service paths on this website may be a post-login destination. */
export function serviceReturnTo(search: string): string | undefined {
  const path = new URLSearchParams(search).get('returnTo') ?? ''
  if (!/^\/services(?:[/?]|$)/.test(path) || /[\\\r\n]/.test(path))
    return undefined
  return path
}
