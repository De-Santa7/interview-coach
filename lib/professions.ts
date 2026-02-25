export interface ProfessionCategory {
  label: string;
  professions: string[];
}

export const PROFESSION_CATEGORIES: ProfessionCategory[] = [
  {
    label: "Tech",
    professions: [
      "Frontend Developer",
      "Backend Developer",
      "Full-Stack Developer",
      "Mobile Developer",
      "DevOps Engineer",
      "Data Scientist",
      "Data Analyst",
      "Machine Learning Engineer",
      "Cybersecurity Analyst",
      "Cloud Engineer",
      "QA Engineer",
      "Blockchain Developer",
      "Software Engineer",
      "Site Reliability Engineer",
      "Data Engineer",
      "AI/ML Researcher",
      "Embedded Systems Engineer",
      "Game Developer",
      "Business Intelligence Engineer",
    ],
  },
  {
    label: "Design",
    professions: [
      "UX Designer",
      "UI Designer",
      "Product Designer",
      "Graphic Designer",
      "Motion Designer",
      "UX Researcher",
      "Creative Director",
    ],
  },
  {
    label: "Business",
    professions: [
      "Product Manager",
      "Project Manager",
      "Business Analyst",
      "Scrum Master",
      "Operations Manager",
      "Strategy Consultant",
      "Technical Program Manager",
      "Solutions Architect",
      "Engineering Manager",
    ],
  },
  {
    label: "Finance",
    professions: [
      "Financial Analyst",
      "Investment Banker",
      "Accountant",
      "Risk Analyst",
      "Auditor",
    ],
  },
  {
    label: "Healthcare",
    professions: [
      "Nurse",
      "Doctor",
      "Pharmacist",
      "Physiotherapist",
      "Medical Lab Scientist",
      "Radiographer",
      "Clinical Psychologist",
      "Dentist",
      "Public Health Officer",
    ],
  },
  {
    label: "Education",
    professions: [
      "Teacher",
      "Lecturer",
      "Instructional Designer",
      "Education Coordinator",
    ],
  },
  {
    label: "Marketing & Sales",
    professions: [
      "Marketing Manager",
      "Digital Marketer",
      "SEO Specialist",
      "Copywriter",
      "Sales Executive",
      "Brand Strategist",
      "Social Media Manager",
      "Growth Marketer",
      "Content Strategist",
      "Account Executive",
      "Customer Success Manager",
    ],
  },
  {
    label: "Legal & HR",
    professions: [
      "Lawyer",
      "HR Manager",
      "Recruiter",
      "Compliance Officer",
      "Legal Analyst",
    ],
  },
  {
    label: "Engineering",
    professions: [
      "Civil Engineer",
      "Mechanical Engineer",
      "Electrical Engineer",
      "Chemical Engineer",
      "Structural Engineer",
    ],
  },
  {
    label: "Media & Creative",
    professions: [
      "Journalist",
      "Content Creator",
      "Video Editor",
      "Photographer",
      "Voice Actor",
      "Technical Writer",
    ],
  },
];

export const PROFESSIONS = PROFESSION_CATEGORIES.flatMap((c) => c.professions);

export const CODE_PROFESSIONS = new Set([
  "Frontend Developer",
  "Backend Developer",
  "Full-Stack Developer",
  "Mobile Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Data Engineer",
  "Machine Learning Engineer",
  "AI/ML Researcher",
  "Cybersecurity Analyst",
  "Cloud Engineer",
  "QA Engineer",
  "Blockchain Developer",
  "Software Engineer",
  "Site Reliability Engineer",
  "Embedded Systems Engineer",
  "Game Developer",
  "Business Intelligence Engineer",
]);

export function isCodeProfession(profession: string): boolean {
  return CODE_PROFESSIONS.has(profession);
}

export function filterProfessions(query: string): string[] {
  if (!query.trim()) return PROFESSIONS.slice(0, 10);
  const lower = query.toLowerCase();
  return PROFESSIONS.filter((p) => p.toLowerCase().includes(lower)).slice(0, 10);
}
