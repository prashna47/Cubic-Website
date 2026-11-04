import assert from 'node:assert/strict'
import test from 'node:test'

Object.assign(process.env, {
  DATABASE_URL: 'postgresql://test:test@localhost/test',
  DIRECT_URL: 'postgresql://test:test@localhost/test',
  CLERK_PUBLISHABLE_KEY: 'test',
  CLERK_SECRET_KEY: 'test',
})
const { approvedEmailsFromTable, createServiceApprovalCheck } =
  await import('../dist/middleware/serviceAccess.js')
const { createRateLimiter } = await import('../dist/middleware/rateLimit.js')

function response() {
  return {
    headers: {},
    code: 200,
    body: null,
    setHeader(key, value) {
      this.headers[key] = value
    },
    status(code) {
      this.code = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

test('approval accepts headerless lists and normalizes email, but rejects an unrelated fallback tab', () => {
  assert.deepEqual(
    [
      ...approvedEmailsFromTable([
        [' Person@Example.com '],
        ['other@example.com'],
      ]),
    ],
    ['person@example.com', 'other@example.com'],
  )
  assert.deepEqual(
    [
      ...approvedEmailsFromTable([
        ['Name', 'Email'],
        ['Person', 'PERSON@example.com'],
      ]),
    ],
    ['person@example.com'],
  )
  assert.throws(() =>
    approvedEmailsFromTable([
      ['Link', 'Date'],
      ['https://example.com', '2026-01-01'],
    ]),
  )
  assert.equal(approvedEmailsFromTable([['Email']]).size, 0)
})

for (const scenario of [
  {
    label: 'approved verified primary email',
    email: 'PERSON@example.com',
    verified: true,
    listed: true,
    code: 200,
  },
  {
    label: 'unlisted email',
    email: 'person@example.com',
    verified: true,
    listed: false,
    code: 403,
  },
  {
    label: 'unverified email',
    email: 'person@example.com',
    verified: false,
    listed: true,
    code: 403,
  },
  {
    label: 'missing primary email',
    email: null,
    verified: true,
    listed: true,
    code: 403,
  },
  {
    label: 'approval source outage',
    email: 'person@example.com',
    verified: true,
    listed: true,
    outage: true,
    code: 503,
  },
]) {
  test(`service access: ${scenario.label}`, async () => {
    const check = createServiceApprovalCheck({
      getUserId: () => 'test-user',
      getUser: async () => ({
        primaryEmailAddress: scenario.email
          ? {
              emailAddress: scenario.email,
              verification: {
                status: scenario.verified ? 'verified' : 'unverified',
              },
            }
          : null,
      }),
      getApprovedEmails: async () => {
        if (scenario.outage) throw new Error('Sheet unavailable')
        return new Set(scenario.listed ? ['person@example.com'] : [])
      },
    })
    const res = response()
    let continued = false
    await check({}, res, () => {
      continued = true
    })
    assert.equal(res.code, scenario.code)
    assert.equal(continued, scenario.code === 200)
    assert.equal(res.headers['Cache-Control'], 'no-store')
    if (scenario.code === 403)
      assert.equal(res.body.message, 'Unverified user cannot access services')
  })
}

test('rate limit blocks excess requests, separates clients and resets after the window', () => {
  let time = 0
  const limiter = createRateLimiter({
    limit: 2,
    windowMs: 1000,
    now: () => time,
  })
  const hit = (ip) => {
    const res = response()
    let continued = false
    limiter({ ip }, res, () => {
      continued = true
    })
    return { res, continued }
  }
  assert.equal(hit('one').continued, true)
  assert.equal(hit('one').continued, true)
  const blocked = hit('one')
  assert.equal(blocked.res.code, 429)
  assert.equal(blocked.res.headers['Retry-After'], 1)
  assert.equal(hit('two').continued, true)
  time = 1001
  assert.equal(hit('one').continued, true)
})

test('concurrent sheet reads share one fetch and successful results are cached', async () => {
  const { getTable } = await import('../dist/lib/sheet.js')
  const original = globalThis.fetch
  let fetches = 0
  globalThis.fetch = async () => {
    fetches++
    return new Response('Email\nperson@example.com', {
      headers: { 'content-type': 'text/csv' },
    })
  }
  try {
    const tab = { name: 'Test approvals' }
    const [first, second] = await Promise.all([
      getTable(tab, true),
      getTable(tab, true),
    ])
    assert.deepEqual(first, second)
    await getTable(tab, true)
    assert.equal(fetches, 1)
  } finally {
    globalThis.fetch = original
  }
})
