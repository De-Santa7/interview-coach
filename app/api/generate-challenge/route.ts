import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { profession, level } = await req.json();

    const prompt = `You are an expert hiring manager creating a practical interview challenge for a ${level} ${profession} candidate.

First determine the role category from this classification:
- CODE: Frontend Developer, Backend Developer, Full-Stack Developer, Mobile Developer, DevOps Engineer, Data Scientist, Data Engineer, Machine Learning Engineer, AI/ML Researcher, Cybersecurity Analyst, Cloud Engineer, QA Engineer, Blockchain Developer, Software Engineer, Site Reliability Engineer, Embedded Systems Engineer, Game Developer, Business Intelligence Engineer
- CLINICAL: Nurse, Doctor, Pharmacist, Physiotherapist, Medical Lab Scientist, Radiographer, Clinical Psychologist, Dentist, Public Health Officer
- LEGAL: Lawyer, Legal Analyst, Compliance Officer
- FINANCIAL: Financial Analyst, Investment Banker, Accountant, Risk Analyst, Auditor
- PHYSICAL_ENGINEERING: Civil Engineer, Mechanical Engineer, Electrical Engineer, Chemical Engineer, Structural Engineer
- EDUCATION: Teacher, Lecturer, Instructional Designer, Education Coordinator
- MEDIA: Journalist, Content Creator, Technical Writer, Copywriter, Video Editor, Photographer, Voice Actor
- HR: HR Manager, Recruiter
- DESIGN: UX Designer, UI Designer, Product Designer, Graphic Designer, Motion Designer
- MARKETING: Marketing Manager, Digital Marketer, SEO Specialist, Sales Executive, Brand Strategist, Social Media Manager, Growth Marketer, Content Strategist, Account Executive, Customer Success Manager
- MANAGEMENT: Product Manager, Project Manager, Operations Manager, Strategy Consultant, Scrum Master, Engineering Manager, Business Analyst, Technical Program Manager, Solutions Architect, Data Analyst

Based on the role category, generate the APPROPRIATE challenge type:

CODE roles → A real programming/scripting task. The candidate must write actual code (functions, classes, SQL queries, scripts, etc.)

CLINICAL roles → A written clinical scenario: present a patient case (symptoms, history, vitals) and ask the candidate to write a clinical assessment, differential diagnosis, triage decision, or care plan. Type must be "writing".

LEGAL roles → A written legal task: a case brief to analyze and argue, a legal memo to draft, or a compliance issue to assess and respond to in writing. Type must be "writing".

FINANCIAL roles → A written financial scenario: present financial data, ratios, or a business situation and ask the candidate to write an analysis and recommendation. Type must be "writing".

PHYSICAL_ENGINEERING roles → A written technical challenge: a design problem, failure analysis scenario, or engineering report to write (specifications, safety considerations, methodology). Type must be "writing".

EDUCATION roles → Write a complete lesson plan for a specific topic and target age group, including objectives, activities, assessment method, and differentiation strategy. Type must be "writing".

MEDIA roles → Write a news story outline, article draft, interview question set, or content production plan for a given topic and format. Type must be "writing".

HR roles → Write a job description for a given role, or write a structured performance improvement plan for a fictional employee situation. Type must be "writing".

DESIGN roles → Write a UX/design critique and improvement recommendations for a described interface, or respond to a design brief with a structured design approach. Type must be "writing".

MARKETING roles → Write a campaign brief, a pitch deck outline, a marketing strategy summary, or a launch plan for a described product/service. Type must be "writing".

MANAGEMENT roles → Write a project kick-off brief, a product requirements document (PRD) section, a stakeholder update memo, or a strategic recommendation for a described business problem. Type must be "writing".

The challenge must be:
- Realistic and role-authentic — something actually encountered in ${profession} work
- Scoped for 15 minutes at ${level} experience level
- Specific enough that the candidate knows exactly what to write/produce
- Set in a clear fictional company/scenario context

Return ONLY valid JSON (no markdown, no explanation):
{
  "title": "Short challenge title (max 10 words)",
  "brief": "Detailed challenge description with context, specific requirements, and exact deliverable. 3-5 sentences. Be concrete and specific.",
  "type": "code" or "writing",
  "language": "javascript|python|sql|typescript|etc (only if type is code, otherwise omit this field)",
  "context": "One sentence describing the fictional company and scenario"
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    const jsonText = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const challenge = JSON.parse(jsonText);

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error("Error generating challenge:", error);
    return NextResponse.json(
      { error: "Failed to generate challenge" },
      { status: 500 }
    );
  }
}
