// import dotenv from "dotenv"
// import { PrismaPg } from "@prisma/adapter-pg"
// import { PrismaClient } from "@prisma/client/index"
// import { Pool } from "@/lib/structure/cores/pg"
//
// import { supabaseDirectUrl } from "@/lib/utils/environment"
//
// dotenv.config({
//   override: false,
//   debug: false,
//   quiet: true,
// })
//
// const pool = new Pool({ connectionString: supabaseDirectUrl ?? "" })
// const adapter = new PrismaPg(pool)
// const prisma = new PrismaClient({ adapter })
//
// export { prisma }
