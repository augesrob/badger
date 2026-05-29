import { NextResponse } from 'next/server'

// Lightweight endpoint the Android app polls to check for updates.
// Calls GitHub from the server (server env token, never expires in APK),
// filters to access-v* releases, and returns only what the app needs.
export const revalidate = 120 // Vercel edge cache: re-fetch GitHub max every 2 min

export async function GET() {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'BadgerServer',
    }
    const token = process.env.GITHUB_TOKEN
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(
      'https://api.github.com/repos/augesrob/badger-android/releases?per_page=50',
      { headers, next: { revalidate: 120 } }
    )
    if (!res.ok) {
      return NextResponse.json({ error: `GitHub ${res.status}` }, { status: 502 })
    }

    const releases: any[] = await res.json()

    // Pick the highest-numbered access-v* release
    const latest = releases
      .filter((r: any) => typeof r.tag_name === 'string' && r.tag_name.startsWith('access-v'))
      .sort((a: any, b: any) => {
        const n = (r: any) => parseInt(r.tag_name.replace('access-v', ''), 10) || 0
        return n(b) - n(a)
      })[0]

    if (!latest) return NextResponse.json({ error: 'No releases found' }, { status: 404 })

    const versionCode = parseInt(latest.tag_name.replace('access-v', ''), 10)
    const apk = (latest.assets ?? []).find((a: any) => a.name?.endsWith('.apk'))
    if (!apk) return NextResponse.json({ error: 'No APK asset' }, { status: 404 })

    return NextResponse.json({
      versionCode,
      tagName: latest.tag_name,
      downloadUrl: apk.browser_download_url, // public repo — no auth needed to download
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 })
  }
}
