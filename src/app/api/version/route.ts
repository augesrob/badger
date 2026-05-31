import { NextResponse } from 'next/server'

export const revalidate = 300

export async function GET() {
  const token = process.env.GITHUB_TOKEN

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'badger-website',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(
    'https://api.github.com/repos/augesrob/badger-android/releases?per_page=50',
    { headers, next: { revalidate: 300 } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: `GitHub API error ${res.status}` }, { status: 500 })
  }

  const releases = (await res.json()) as Array<{ tag_name: string }>
  let latest = 0
  for (const r of releases) {
    const m = r.tag_name.match(/^access-v(\d+)$/)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n > latest) latest = n
    }
  }

  if (latest === 0) {
    return NextResponse.json({ error: 'No access releases found' }, { status: 404 })
  }

  return NextResponse.json({ version: latest })
}
