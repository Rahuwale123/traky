import { db, pool } from "../db/client";
import { designations, organizations, projects, tasks, users } from "../db/schema/index";
import { hashPassword } from "../utils/password";

const DESIGNATIONS: { name: string; category: string }[] = [
  // Engineering
  { name: "Software Engineer", category: "Engineering" },
  { name: "Sr Software Engineer", category: "Engineering" },
  { name: "Backend Developer", category: "Engineering" },
  { name: "Frontend Developer", category: "Engineering" },
  { name: "Full Stack Developer", category: "Engineering" },
  { name: "Jr Python Developer", category: "Engineering" },
  { name: "Sr Python Developer", category: "Engineering" },
  { name: "Angular Developer", category: "Engineering" },
  { name: "React Developer", category: "Engineering" },
  { name: "Node.js Developer", category: "Engineering" },
  { name: "iOS Developer", category: "Engineering" },
  { name: "Android Developer", category: "Engineering" },
  { name: "DevOps Engineer", category: "Engineering" },
  { name: "Site Reliability Engineer", category: "Engineering" },
  { name: "QA Engineer", category: "Engineering" },
  { name: "Data Engineer", category: "Engineering" },
  // AI / ML
  { name: "ML Engineer", category: "AI/ML" },
  { name: "AI Engineer", category: "AI/ML" },
  { name: "Agentic AI Engineer", category: "AI/ML" },
  { name: "Data Scientist", category: "AI/ML" },
  { name: "NLP Engineer", category: "AI/ML" },
  { name: "Computer Vision Engineer", category: "AI/ML" },
  // Design
  { name: "UI Designer", category: "Design" },
  { name: "UX Designer", category: "Design" },
  { name: "Product Designer", category: "Design" },
  { name: "Graphic Designer", category: "Design" },
  // Product & Leadership
  { name: "Product Manager", category: "Product & Management" },
  { name: "Project Manager", category: "Product & Management" },
  { name: "Scrum Master", category: "Product & Management" },
  { name: "Business Analyst", category: "Product & Management" },
  { name: "Engineering Manager", category: "Product & Management" },
  { name: "Technical Lead", category: "Product & Management" },
  { name: "VP Engineering", category: "Product & Management" },
  { name: "CTO", category: "Product & Management" },
  // HR
  { name: "HR Manager", category: "Human Resources" },
  { name: "HR Executive", category: "Human Resources" },
  { name: "HR Generalist", category: "Human Resources" },
  { name: "Talent Acquisition Specialist", category: "Human Resources" },
  { name: "People Operations Manager", category: "Human Resources" },
  { name: "Recruiter", category: "Human Resources" },
  // Sales & Marketing
  { name: "Sales Executive", category: "Sales & Marketing" },
  { name: "Sales Manager", category: "Sales & Marketing" },
  { name: "Marketing Manager", category: "Sales & Marketing" },
  { name: "Digital Marketing Specialist", category: "Sales & Marketing" },
  { name: "Content Writer", category: "Sales & Marketing" },
  { name: "SEO Specialist", category: "Sales & Marketing" },
  { name: "Social Media Manager", category: "Sales & Marketing" },
  // Finance & Operations
  { name: "Finance Manager", category: "Finance & Operations" },
  { name: "Accountant", category: "Finance & Operations" },
  { name: "Operations Manager", category: "Finance & Operations" },
  { name: "Business Operations Analyst", category: "Finance & Operations" },
  // Customer Success
  { name: "Customer Success Manager", category: "Customer Success" },
  { name: "Support Engineer", category: "Customer Success" },
];

async function seedDesignations() {
  await db.insert(designations).values(DESIGNATIONS).onConflictDoNothing({ target: designations.name });
  const all = await db.query.designations.findMany();
  return new Map(all.map((d) => [d.name, d.id]));
}

async function main() {
  console.log("Seeding database...");

  const designationIdByName = await seedDesignations();
  const byName = (name: string) => {
    const id = designationIdByName.get(name);
    if (!id) throw new Error(`Unknown designation seeded in script: ${name}`);
    return id;
  };

  const [org] = await db
    .insert(organizations)
    .values({ name: "Traky Demo Co", slug: "traky-demo-co" })
    .returning();
  if (!org) throw new Error("Failed to seed organization");

  const adminPasswordHash = await hashPassword("Admin@123");
  const [admin] = await db
    .insert(users)
    .values({
      organizationId: org.id,
      email: "admin@traky.dev",
      passwordHash: adminPasswordHash,
      fullName: "Ava Admin",
      role: "ADMIN",
    })
    .returning();
  if (!admin) throw new Error("Failed to seed admin");

  const managerPasswordHash = await hashPassword("Manager@123");
  const [managerOne] = await db
    .insert(users)
    .values({
      organizationId: org.id,
      email: "manager1@traky.dev",
      passwordHash: managerPasswordHash,
      fullName: "Marcus Manager",
      role: "MANAGER",
      designationId: byName("Engineering Manager"),
    })
    .returning();
  const [managerTwo] = await db
    .insert(users)
    .values({
      organizationId: org.id,
      email: "manager2@traky.dev",
      passwordHash: managerPasswordHash,
      fullName: "Maria Manager",
      role: "MANAGER",
      designationId: byName("Product Manager"),
    })
    .returning();
  if (!managerOne || !managerTwo) throw new Error("Failed to seed managers");

  const employeePasswordHash = await hashPassword("Employee@123");
  const employeeSeeds = [
    ["Ethan Employee", managerOne.id, "Sr Python Developer"],
    ["Emma Employee", managerOne.id, "UI Designer"],
    ["Ezra Employee", managerOne.id, "Angular Developer"],
    ["Ivy Employee", managerTwo.id, "ML Engineer"],
    ["Ian Employee", managerTwo.id, "AI Engineer"],
    ["Iris Employee", managerTwo.id, "Agentic AI Engineer"],
  ] as const;

  const employees = [];
  for (const [fullName, managerId, designationName] of employeeSeeds) {
    const emailLocalPart = fullName.toLowerCase().split(" ")[0];
    const [employee] = await db
      .insert(users)
      .values({
        organizationId: org.id,
        email: `${emailLocalPart}@traky.dev`,
        passwordHash: employeePasswordHash,
        fullName,
        role: "EMPLOYEE",
        managerId,
        designationId: byName(designationName),
      })
      .returning();
    if (!employee) throw new Error(`Failed to seed employee ${fullName}`);
    employees.push(employee);
  }

  const [projectOne] = await db
    .insert(projects)
    .values({
      organizationId: org.id,
      managerId: managerOne.id,
      name: "Website Revamp",
      description: "Redesign the marketing site and landing pages",
    })
    .returning();
  const [projectTwo] = await db
    .insert(projects)
    .values({
      organizationId: org.id,
      managerId: managerTwo.id,
      name: "Mobile App Launch",
      description: "Ship v1 of the mobile app to app stores",
    })
    .returning();
  if (!projectOne || !projectTwo) throw new Error("Failed to seed projects");

  const teamOne = employees.slice(0, 3);
  const teamTwo = employees.slice(3, 6);

  const taskSeeds = [
    { project: projectOne, manager: managerOne, team: teamOne },
    { project: projectTwo, manager: managerTwo, team: teamTwo },
  ];

  const statuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
  const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

  for (const { project, manager, team } of taskSeeds) {
    for (let i = 0; i < 6; i += 1) {
      const assignee = team[i % team.length];
      if (!assignee) continue;
      await db.insert(tasks).values({
        organizationId: org.id,
        projectId: project.id,
        assigneeId: assignee.id,
        createdById: manager.id,
        title: `${project.name} — task ${i + 1}`,
        description: "Seeded sample task",
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
      });
    }
  }

  console.log("Seed complete:");
  console.log(`  Org:      ${org.name} (${org.slug})`);
  console.log(`  Admin:    admin@traky.dev / Admin@123`);
  console.log(`  Managers: manager1@traky.dev, manager2@traky.dev / Manager@123`);
  console.log(`  Employees: ${employees.map((e) => e.email).join(", ")} / Employee@123`);
  console.log(`  Designations seeded: ${designationIdByName.size}`);

  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
