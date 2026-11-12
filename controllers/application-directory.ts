import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getApplicationDirectory as getApplicationDirectoryServices } from "@/services/application-directory";

export async function getApplicationDirectory(context: Context) {
  const environment = context.req.query("environment");
  if (environment !== "local" && environment !== "production")
    throw new HTTPException(400, { message: "directory_environment_required" });
  context.header("Cache-Control", "no-store");
  return context.json(await getApplicationDirectoryServices(environment));
}
