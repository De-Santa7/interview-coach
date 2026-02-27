import Groq from "groq-sdk";
import { NextRequest } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const {
      profession,
      level,
      interviewType,
      questions,
      answers,
      challenge,
      challengeSubmission,
    } = await req.json();

    const isNewGrad = level === "New Graduate";

    const qaSection = questions
      .map((q: { id: string; text: string }, i: number) => {
        const answer = answers.find(
          (a: { questionId: string; text: string }) => a.questionId === q.id
        );
        return `Q${i + 1}: ${q.text}\nAnswer: ${answer?.text || "(No answer provided)"}`;
      })
      .join("\n\n");

    const challengeSection = challenge
      ? `\n\nPRACTICAL CHALLENGE\nTitle: ${challenge.title}\nBrief: ${challenge.brief}\nSubmission:\n${challengeSubmission || "(No submission)"}`
      : "";

    const newGradEvaluation = isNewGrad ? `
IMPORTANT — NEW GRADUATE EVALUATION:
This is a recent graduate with NO professional work experience. Evaluate accordingly:
- Do NOT penalize for lack of work experience — that is expected
- DO evaluate: intellectual potential, learning ability, academic knowledge depth, problem-solving approach, communication clarity, enthusiasm, and growth mindset
- DO credit: academic projects, coursework examples, internships, personal projects, hackathons, and student activities
- The verdict should reflect their POTENTIAL as a new hire, not their current professional track record
- "Strong Hire" means they show exceptional potential, clear thinking, and strong foundational knowledge
- "No Hire" means they couldn't demonstrate basic domain understanding or professionalism
- Be encouraging but honest — highlight what they'd need to develop in their first year
` : "";

    const prompt = `You are a senior hiring manager evaluating a ${level} ${profession} candidate. Provide a comprehensive, honest hiring assessment.

CANDIDATE PROFILE
Role: ${level} ${profession}
Interview Type: ${interviewType}
${isNewGrad ? "Note: This is an entry-level / new graduate position." : ""}

INTERVIEW Q&A
${qaSection}${challengeSection}
${newGradEvaluation}
DOMAIN-SPECIFIC EVALUATION CRITERIA
Apply the criteria most relevant to the ${profession} role:
- Software/Tech roles: Code quality, system design thinking, debugging approach, scalability awareness, tooling knowledge
- Healthcare roles (Nurse, Doctor, Pharmacist, etc.): Clinical reasoning, patient safety awareness, evidence-based decisions, ethical judgment, interdisciplinary communication
- Legal roles: Legal reasoning, case analysis quality, ethical awareness, argumentation clarity, jurisdiction/procedural accuracy
- Financial roles: Quantitative rigor, risk awareness, regulatory knowledge, analytical framework quality
- Engineering roles (Civil, Mechanical, etc.): Technical accuracy, safety-first thinking, standards knowledge, design methodology
- Education roles: Pedagogical soundness, differentiation strategies, learning objectives clarity, student engagement approach
- Marketing/Sales roles: Strategic thinking, data-driven reasoning, customer insight, channel expertise
- HR roles: Employment law awareness, people-first thinking, process fairness, conflict handling
- Management/Strategy roles: Stakeholder alignment, prioritisation logic, cross-functional awareness, decision frameworks
- Design roles: User-centred thinking, design rationale, accessibility awareness, critique quality
- Media/Creative roles: Audience awareness, storytelling structure, editorial judgment, platform fluency

Evaluate critically and fairly. Be specific — reference actual things the candidate said. Don't be generic.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "verdict": "Strong Hire" | "Hire" | "Maybe" | "No Hire",
  "overallScore": <integer 0-100>,
  "questions": [
    {
      "question": "<question text>",
      "answer": "<candidate's answer>",
      "score": <integer 1-10>,
      "strengths": ["<specific strength from their answer>", ...],
      "gaps": ["<specific gap or missed point>", ...],
      "idealAnswer": "<what a great answer would include, 2-4 sentences>"
    }
  ],
  ${
    challenge
      ? `"challenge": {
    "brief": "<challenge brief>",
    "submission": "<candidate's submission>",
    "score": <integer 1-10>,
    "feedback": "<detailed feedback referencing specific parts of their submission, 3-5 sentences>",
    "idealSubmission": "<what an excellent submission would look like, 3-4 sentences>"
  },`
      : ""
  }
  "strengths": ["<top strength 1>", "<top strength 2>", "<top strength 3>"],
  "improvements": ["<improvement area 1>", "<improvement area 2>", "<improvement area 3>"],
  "recommendation": "<One crisp sentence hiring recommendation${isNewGrad ? " that considers their potential and learning trajectory" : ""}>"}`;

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(JSON.stringify({ error: "Failed to generate report" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
