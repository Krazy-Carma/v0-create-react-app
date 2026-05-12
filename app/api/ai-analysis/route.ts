import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const PRESET_NAMES: Record<string, string> = {
  balanced: "Balanced Master",
  warm: "Warm & Analog",
  bright: "Bright & Modern",
  loud: "Loud & Punchy",
  cinematic: "Cinematic Wide",
};

export async function POST(req: NextRequest) {
  const { fileName, fileType } = await req.json();

  if (!fileName) {
    return NextResponse.json({ error: "fileName is required" }, { status: 400 });
  }

  const prompt = `You are a professional audio mastering engineer. Based only on the track filename and file type provided, give mastering recommendations.

Track: "${fileName}"
File type: ${fileType || "audio"}

Respond with a JSON object (no markdown, no code fences) with these exact keys:
- genre: detected genre (one of: Electronic, Hip Hop, Pop, Rock, Ambient, Jazz, R&B, Classical, Country, Metal, Folk, Other)
- summary: 1-2 sentence mastering recommendation mentioning the track name
- eqTips: one specific EQ tip (under 15 words)
- compTips: one specific compression tip (under 15 words)
- stereoTips: one specific stereo imaging tip (under 15 words)
- loudnessTips: loudness target tip with LUFS value (under 15 words)
- recommendedPreset: one of: balanced, warm, bright, loud, cinematic

Base genre detection on keywords in the filename (e.g. "beat", "trap", "orchestral", "acoustic", "club", "lofi", etc). When unsure, choose the most fitting preset for general music production.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  let analysis: Record<string, string>;
  try {
    analysis = JSON.parse(text);
  } catch {
    // If parsing fails, extract JSON from the response
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
    analysis = JSON.parse(match[0]);
  }

  // Validate recommendedPreset is one of the known keys
  if (!PRESET_NAMES[analysis.recommendedPreset]) {
    analysis.recommendedPreset = "balanced";
  }

  return NextResponse.json(analysis);
}
