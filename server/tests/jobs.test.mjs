import assert from 'node:assert/strict'
import test from 'node:test'

// Test the compiled API logic without live Sheets, job sites, or credentials.
Object.assign(process.env, {
  DATABASE_URL: 'postgresql://test:test@localhost/test',
  DIRECT_URL: 'postgresql://test:test@localhost/test',
  CLERK_PUBLISHABLE_KEY: 'test',
  CLERK_SECRET_KEY: 'test',
})
const { getJobs } = await import('../dist/lib/jobs.js')

test('merges referral variants, keeps latest dates and supplied details, and recovers Workday metadata offline', async () => {
  const originalFetch = globalThis.fetch
  const csv = [
    'Link,Date,Company,Title,Site',
    'https://buildertrend.wd108.myworkdayjobs.com/External/job/Remote/Senior-Data-Engineer_JR-000431?source=LinkedIn,2026-09-25,,,',
    'https://buildertrend.wd108.myworkdayjobs.com/External/job/Remote/Senior-Data-Engineer_JR-000431?utm_source=email,2026-09-26,,,',
    'https://example.com/jobs?id=1&source=email,2026-09-25,Acme,Engineer,Acme Careers',
    'https://example.com/jobs?source=other&id=1,2026-09-26,,,',
    'https://example.com/jobs?id=2,2026-09-24,Acme,Designer,Acme Careers',
    'https://,2026-09-24,,,',
  ].join('\n')
  globalThis.fetch = async (url) => {
    if (String(url).startsWith('https://docs.google.com/')) {
      return new Response(csv, { headers: { 'content-type': 'text/csv' } })
    }
    throw new Error('Job site unavailable')
  }
  try {
    const jobs = await getJobs(true)
    assert.equal(jobs.length, 3)
    const workday = jobs.find((job) => job.site === 'Workday')
    assert.equal(workday.company, 'Buildertrend')
    assert.equal(workday.title, 'Senior Data Engineer')
    assert.equal(workday.dateAdded, '2026-09-26T00:00:00.000Z')
    const acme = jobs.find(
      (job) => new URL(job.url).searchParams.get('id') === '1',
    )
    assert.equal(acme.company, 'Acme')
    assert.equal(acme.title, 'Engineer')
    assert.equal(acme.site, 'Acme Careers')
    assert.equal(acme.dateAdded, '2026-09-26T00:00:00.000Z')
    assert.ok(jobs.some((job) => job.title === 'Designer'))
  } finally {
    globalThis.fetch = originalFetch
  }
})
