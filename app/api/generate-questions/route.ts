import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { profession, level, interviewType, questionCount } = await req.json();

    const prompt = `You are an expert hiring professional with deep knowledge of ${profession} roles. Generate ${questionCount} realistic interview questions for a ${level} ${profession} candidate.

Interview type: ${interviewType}
- Technical: Domain knowledge, professional skills, tools, methods, and technical competencies specific to the ${profession} role
- Behavioral: Past experiences, decision-making, teamwork, professional situations relevant to ${profession}
- Mixed: A balanced blend of both

Domain guidance by role type:
- Software/Tech roles: Focus on architecture, code quality, debugging, system design, tools
- Healthcare roles (Nurse, Doctor, Pharmacist, etc.): Clinical decision-making, patient care, protocols, ethics, safety, interdisciplinary collaboration
- Legal roles: Case analysis, legal reasoning, client management, ethics, jurisdiction knowledge
- Financial roles: Analysis frameworks, risk assessment, regulatory knowledge, modeling approaches
- Engineering roles (Civil, Mechanical, etc.): Design principles, safety standards, project management, technical specifications
- Education roles: Pedagogy, curriculum design, classroom management, student engagement, differentiation
- Marketing/Sales roles: Campaign strategy, metrics, customer insight, persuasion, channel expertise
- HR roles: Employment law, talent acquisition, performance management, employee relations, culture
- Management/Strategy roles: Stakeholder management, prioritization frameworks, OKRs, cross-functional leadership
- Design roles: User research, design thinking, critique methodology, accessibility, design systems
- Media/Creative roles: Editorial judgment, storytelling, audience understanding, platform expertise, production workflow

Requirements:
- Every question must be SPECIFIC to the ${profession} role — not generic management/communication questions that could apply to anyone
- Calibrate depth and complexity to ${level} experience
- Each question must require a substantive 2–3 minute answer with specific examples
- No yes/no questions
- For Behavioral questions: use STAR-style prompts ("Tell me about a time when...")
- For Technical questions: ask about real tools, methodologies, and scenarios from the ${profession} field

Return ONLY valid JSON (no markdown, no explanation):
[
  {
    "id": "q1",
    "text": "Question text here",
    "category": "Technical" or "Behavioral"
  }
]`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    const jsonText = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const questions = JSON.parse(jsonText);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
