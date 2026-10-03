import type { Candidate } from "@/types/candidate";

const createdAt = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

const profiles = [
  [
    "Ella Green",
    "Lead Full Stack Engineer",
    6.5,
    "San Francisco, CA",
    ["React", "TypeScript", "FastAPI", "Python", "AWS", "Docker", "PostgreSQL", "Redis"],
  ],
  [
    "Rahul Kumar",
    "Python Backend Developer",
    3.5,
    "Bengaluru, India",
    ["Python", "FastAPI", "AWS", "MongoDB", "Docker"],
  ],
  [
    "Priya Raman",
    "Senior Backend Engineer",
    6,
    "Chennai, India",
    ["Python", "Django", "PostgreSQL", "AWS", "Redis"],
  ],
  [
    "Marcus Feld",
    "Product Designer",
    5,
    "Berlin, Germany",
    ["Figma", "Design Systems", "Research", "Prototyping"],
  ],
  [
    "Elena Vasquez",
    "Data Analyst",
    4,
    "Madrid, Spain",
    ["SQL", "Python", "Tableau", " dbt", "BigQuery"],
  ],
  [
    "Tobias Lind",
    "Frontend Developer",
    2,
    "Stockholm, Sweden",
    ["React", "TypeScript", "CSS", "Next.js"],
  ],
  [
    "Aisha Patel",
    "Full Stack Developer",
    7,
    "London, UK",
    ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
  ],
  [
    "Daniel Okafor",
    "Java Developer",
    8,
    "Dublin, Ireland",
    ["Java", "Spring Boot", "Kafka", "Kubernetes"],
  ],
  [
    "Mei Tanaka",
    "Data Engineer",
    5.5,
    "Tokyo, Japan",
    ["Python", "Spark", "Airflow", "Snowflake", "SQL"],
  ],
  [
    "Noah Williams",
    "Frontend Engineer",
    3,
    "Toronto, Canada",
    ["React", "TypeScript", "Accessibility", "GraphQL"],
  ],
  [
    "Sofia Costa",
    "Backend Developer",
    1.5,
    "Lisbon, Portugal",
    ["Node.js", "Express", "MongoDB", "Docker"],
  ],
  [
    "Arjun Mehta",
    "Python Developer",
    4.5,
    "Pune, India",
    ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker"],
  ],
  [
    "Camila Reyes",
    "Product Designer",
    7,
    "Mexico City, Mexico",
    ["Figma", "Design Systems", "Research", "Accessibility"],
  ],
  [
    "Ethan Park",
    "Full Stack Developer",
    6.5,
    "Seoul, South Korea",
    ["React", "Java", "Spring Boot", "AWS", "Docker"],
  ],
  ["Grace Chen", "Data Engineer", 2.5, "Singapore", ["Python", "SQL", "Airflow", "BigQuery"]],
  [
    "Omar Hassan",
    "Java Developer",
    3.5,
    "Cairo, Egypt",
    ["Java", "Spring Boot", "PostgreSQL", "Kafka"],
  ],
  [
    "Isabella Rossi",
    "Frontend Developer",
    5,
    "Milan, Italy",
    ["React", "TypeScript", "Figma", "CSS"],
  ],
  [
    "Kwame Mensah",
    "Backend Developer",
    9,
    "Accra, Ghana",
    ["Python", "Django", "AWS", "Kubernetes", "PostgreSQL"],
  ],
  ["Nina Johansson", "Data Analyst", 3, "Oslo, Norway", ["SQL", "Python", "Tableau", "Snowflake"]],
  [
    "Vikram Shah",
    "Full Stack Developer",
    4,
    "Mumbai, India",
    ["React", "Node.js", "MongoDB", "TypeScript"],
  ],
  [
    "Chloe Martin",
    "Python Backend Developer",
    10,
    "Paris, France",
    ["Python", "FastAPI", "AWS", "PostgreSQL", "Docker"],
  ],
] as const;

export const mockCandidates: Candidate[] = profiles.map(
  ([name, role, experienceYears, location, skills], index) => {
    const first = name.split(" ")[0]?.toLowerCase() ?? "candidate";
    const years = Math.floor(experienceYears);
    const candidateId = name === "Ella Green" ? "6ab92b1bead5191a114eaa73" : `candidate-${index + 1}`;
    return {
      id: candidateId,
      name,
      email: `${first}@example.test`,
      phone: `+1 (555) 01${String(index + 1).padStart(2, "0")}`,
      location,
      currentRole: role,
      experienceYears,
      skills: [...skills].map((skill) => skill.trim()),
      education: [
        {
          degree: index % 3 === 0 ? "M.Tech, Computer Science" : "B.Tech, Computer Science",
          school:
            ["National Institute of Technology", "University of Technology", "City University"][
              index % 3
            ] ?? "City University",
          period: `${2025 - years} – ${2021 - years}`,
          level: index % 3 === 0 ? "Master's" : "Bachelor's",
        },
      ],
      experience: [
        {
          title: role,
          company:
            ["Northstar Labs", "Meridian Systems", "Fieldwork Digital"][index % 3] ??
            "Northstar Labs",
          period: `${2023 - Math.min(years - 1, 4)} – Present`,
          location: location,
          highlights: [
            `Built reliable ${role.toLowerCase()} solutions for production teams.`,
            `Collaborated across product and engineering to improve delivery quality.`,
          ],
          achievements: [
            `Reduced deployment latency by 35% across core services.`,
            `Recognized as High Impact Contributor for quarterly roadmap delivery.`,
          ],
        },
        {
          title: "Software Engineer",
          company: "Previous company",
          period: `${2021 - years} – ${2023 - Math.min(years - 1, 4)}`,
          location: "Remote",
          highlights: [`Delivered maintainable features using ${skills[0]}.`],
          achievements: [
            `Authored architectural RFCs adopted by 12+ developers.`,
          ],
        },
      ],
      projects: [
        {
          name: "Service observability toolkit",
          description: "A lightweight monitoring dashboard for distributed application services.",
          stack: [skills[0] ?? "Python", skills[1] ?? "SQL"],
        },
      ],
      certifications: [{ name: index % 2 === 0 ? "Cloud Practitioner" : "Professional Skills Certificate" }],
      achievements: [
        `Led technical modernization impacting 100k+ monthly active users.`,
        `Top 5% performer in annual engineering excellence evaluations.`,
      ],
      summary: `${role} with ${experienceYears} years of experience delivering dependable products. Comfortable working across teams and building maintainable systems with ${skills.slice(0, 3).join(", ")}.`,
      uploadedAt: createdAt((index * 3 + 1) % 31),
      availability:
        index % 4 === 0 ? "Open to opportunities" : index % 4 === 1 ? "Available" : "Not specified",
    };
  },
);
