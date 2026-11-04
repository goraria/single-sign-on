export function formatCommerceTeamMembers<T extends { userId: string }>(
  members: T[],
  users: Array<{
    id: string
    name: string
    email: string
    image: string | null
  }>
) {
  const byId = new Map(users.map((user) => [user.id, user]))
  return members.map((member) => ({
    ...member,
    user: byId.get(member.userId) ?? {
      id: member.userId,
      name: "Unavailable user",
      email: "",
      image: null,
    },
  }))
}
