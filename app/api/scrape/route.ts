import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    // Jina Reader handles the scraping for free without an API key
    const response = await fetch(`https://r.jina.ai/${url}`);

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to scrape" }, { status: 500 });
    }

    const markdown = await response.text();
    // Return as a JSON object so the frontend can read data.markdown
    return NextResponse.json({ markdown });
  } catch (error: any) {
    return NextResponse.json({ error: "Backend crash" }, { status: 500 });
  }
}
