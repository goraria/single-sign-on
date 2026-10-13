export interface Role {
  role: string
  group: string
  accessLevel: string
  users: number
  permissionSets: string[]
  lastReview: string
  owner: string
  status: "Active" | "Needs review"
}

export const roles: Role[] = [
  {
    role: "User",
    group: "System roles",
    accessLevel: "Personal",
    users: 0,
    permissionSets: ["User dashboard", "Settings"],
    lastReview: "Demo",
    owner: "System",
    status: "Active",
  },
  {
    role: "Vice",
    group: "System roles",
    accessLevel: "Scoped",
    users: 0,
    permissionSets: ["Vice dashboard", "Settings"],
    lastReview: "Demo",
    owner: "System",
    status: "Active",
  },
  {
    role: "Admin",
    group: "System roles",
    accessLevel: "Full",
    users: 0,
    permissionSets: [
      "Admin dashboard",
      "Users",
      "Applications",
      "Resources",
      "Services",
    ],
    lastReview: "Demo",
    owner: "System",
    status: "Active",
  },
  {
    role: "Master",
    group: "System roles",
    accessLevel: "Full",
    users: 0,
    permissionSets: [
      "User dashboard",
      "Vice dashboard",
      "Admin dashboard",
      "All roles",
    ],
    lastReview: "Demo",
    owner: "System",
    status: "Active",
  },
]
