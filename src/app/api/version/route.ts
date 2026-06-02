import { NextResponse } from 'next/server'

// Cached for 5 minutes — reduces GitHub API calls from every device check
export const revalidate = 300

/**
 * GET /api/version
 * Returns the latest badger-android release for the access-vXXX tag series.
 * Response shape must match AppUpdater.VersionResponse on the Android side:
 *   { versionCode: number, tagName: string, downloadUrl: string }
 */
export async function GET() {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      'https://api.github.com/repos/augesrob/badger-android/releases?per_page=50',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'BadgerServer',
        },
        next: { revalidate: 300 },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: `GitHub API error ${res.status}` }, { status: res.status })
    }

    type GhAsset = { name: string; browser_download_url: string }
    type GhRelease = { tag_name: string; assets: GhAsset[] }

    const releases = (await res.json()) as GhRelease[]

    // Find the highest access-vXXX tag
    const latest = releases
      .filter((r) => r.tag_name.startsWith('access-v'))
      .sort((a, b) => {
        const av = parseInt(a.tag_name.replace('access-v', ''), 10)
        const bv = parseInt(b.tag_name.replace('access-v', ''), 10)
        return bv - av
      })[0]

    if (!latest) {
      return NextResponse.json({ error: 'No access-v releases found' }, { status: 404 })
    }

    const tagName = latest.tag_name
    const versionCode = parseInt(tagName.replace('access-v', ''), 10)

    const apkAsset = (latest.assets ?? []).find((a) => a.name.endsWith('.apk'))

    if (!apkAsset) {
      return NextResponse.json({ error: 'No APK asset on latest release' }, { status: 404 })
    }

    return NextResponse.json({
      versionCode,
      tagName,
      downloadUrl: apkAsset.browser_download_url as string,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
