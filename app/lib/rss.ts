export type RssItem = {
  title: string
  link: string
  pubDate: string
  guid: string
}

export type RssChannel = {
  title: string
  link: string
  description: string
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatPubDate(dateStr: string): string {
  try {
    return new Date(dateStr).toUTCString()
  } catch {
    return dateStr
  }
}

export function buildRssFeed(channel: RssChannel, items: RssItem[]): string {
  const itemsXml = items
    .map(
      ({ title, link, pubDate, guid }) =>
        `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <pubDate>${formatPubDate(pubDate)}</pubDate>
      <guid>${escapeXml(guid)}</guid>
    </item>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${escapeXml(channel.link)}</link>
    <description>${escapeXml(channel.description)}</description>
    <language>sl</language>
${itemsXml ? itemsXml + '\n' : ''}  </channel>
</rss>`
}
