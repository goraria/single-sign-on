import { faker } from "@faker-js/faker"
import { z } from "@gorth/structure/cores/zod"

export const userRoleSchema = z.enum(["user", "moderator", "administrator"])

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.url().nullable(),
  role: userRoleSchema,
  bannedUntil: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type User = z.infer<typeof userSchema>

export function createFakerUsers(count = 200): User[] {
  faker.seed(67890)

  return Array.from({ length: count }, () => {
    const name = faker.person.fullName()
    const banned = faker.datatype.boolean({ probability: 0.08 })

    return userSchema.parse({
      id: faker.string.uuid(),
      name,
      email: faker.internet
        .email({ firstName: name.split(" ")[0] })
        .toLowerCase(),
      emailVerified: faker.datatype.boolean({ probability: 0.82 }),
      image: faker.datatype.boolean({ probability: 0.65 })
        ? faker.image.avatar()
        : null,
      role: faker.helpers.arrayElement(userRoleSchema.options),
      bannedUntil: banned ? faker.date.future() : null,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    })
  })
}

export const fakerUsers = createFakerUsers()
