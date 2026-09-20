// import { PrismaClient } from '@prisma/client/index';
// import { isDevelopment, isProduction } from "@/lib/utils/environment";
//
// declare global {
//   var prisma: PrismaClient | undefined;
// }
//
// let prisma: PrismaClient;
//
// if (!global.prisma) {
//   global.prisma = new PrismaClient();
// }
// prisma = global.prisma;
//
// // if (isProduction) {
// //   // Production: create a single instance with optimized connection pool
// //   prisma = global.prisma ?? new PrismaClient({
// //     log: ['error']
// //   });
// //   if (!global.prisma) {
// //     global.prisma = prisma;
// //   }
// // } else {
// //   // Development: create a new instance with connection pool
// //   prisma = global.prisma ?? new PrismaClient({
// //     log: isDevelopment ? ["query", "error", "warn"] : ["error"],
// //   });
// //   if (!global.prisma) {
// //     global.prisma = prisma;
// //   }
// // }
//
// export default prisma;
