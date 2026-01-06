import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Extract all variables from the request body
    const { jobPost, about, instruction, charLimit, platform, selectedTone } = await req.json();
    
    // 2. Add validation to prevent empty requests
    if (!jobPost || !about) {
      return NextResponse.json({ error: "Job post and profile are required." }, { status: 400 });
    }

    // 3. Set defaults for platform and tone
    const currentPlatform = platform || "Upwork";
    const currentTone = selectedTone || "Professional";

    // 4. Construct the prompt using the variables
    const prompt = `You are an expert ${currentPlatform} freelancer. 
Analyze the Job Post for: 1. Main Goal, 2. Required Tech, 3. Budget/Timeline.

Style Guide:
- Platform: ${currentPlatform === 'LinkedIn' ? 'Short, DM-style' : 'Standard Proposal'}
- Tone: ${currentTone}
- Max Length: ${charLimit || 2500} characters.
- Specific Instruction: ${instruction || "Be persuasive and technical."}`;

    // 5. Fetch from Groq API
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `JOB: ${jobPost}\n\nPROFILE: ${about}` }
        ],
        max_tokens: 1000, 
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Groq API Error:", errorText);
      return NextResponse.json({ error: "API Error" }, { status: 500 });
    }

    const data = await res.json();
    const proposal = data.choices?.[0]?.message?.content || "Error generating proposal.";

    return NextResponse.json({ proposal });

  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
