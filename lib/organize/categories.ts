// Organize (PI-facing) readiness placeholders -- docs/DEVELOPMENT_PLAN.md §6.7. These 33 items
// exist so a later Organize launch is additive (fill in a category) rather than a schema
// migration. Locked to exactly 33 -- do not add/remove items without updating the plan doc too.

export type OrganizeCategoryGroup = {
  group: string;
  items: string[];
};

export const ORGANIZE_CATEGORIES: OrganizeCategoryGroup[] = [
  { group: "Research Output", items: ["Papers", "Reviews", "Commentaries", "Reply to Manuscript"] },
  { group: "Grants", items: ["National Grants", "NIH R01 Grants", "International Grants", "R21 Grants"] },
  {
    group: "People",
    items: [
      "Students",
      "Trainees",
      "Postdocs",
      "Lab Manager",
      "Visiting Lecturers",
      "Visiting Fellows/Scholars",
      "Performance Improvement Metrics",
    ],
  },
  {
    group: "Lab Administration",
    items: [
      "Admin",
      "Accounting",
      "Budgeting",
      "Personnel Salaries",
      "Travel",
      "Conferences",
      "Collaborations",
      "Overhead Expenses",
      "Vendors",
      "Think Tank Meeting Organizer & Notes",
      "Lab Meeting Organizer & Scheduling",
    ],
  },
  {
    group: "Lab Resources",
    items: ["Instrument Maintenance", "Animal Experiments", "Animal Food Supply", "Reagents & Chemicals", "Kits", "Software", "Data"],
  },
];

export const ORGANIZE_ITEM_COUNT = ORGANIZE_CATEGORIES.reduce((sum, g) => sum + g.items.length, 0);

if (ORGANIZE_ITEM_COUNT !== 33) {
  throw new Error(`ORGANIZE_CATEGORIES should total exactly 33 items, got ${ORGANIZE_ITEM_COUNT}.`);
}
