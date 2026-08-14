import { isExpressProduction, supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } from "@/lib/utils/environment"
import { createClient } from "@/lib/structure/cores/supabase/index";
// import type { Server as SocketIOServer } from "socket.io";
import { models } from "@/lib/utils/constant";

function Logger(message: string, _type?: string, _color?: string) {
  return message;
}

let isRealtimeBootstrapped = false;
``
export async function createRealtime() {
  if (isRealtimeBootstrapped) {
    return;
  }

  isRealtimeBootstrapped = true;

  const supabase = createClient(
    supabaseUrl!,
    supabaseServiceRoleKey!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      realtime: {
        params: {
          eventsPerSecond: 20
        },
      },
      global: {
        headers: {
          'User-Agent': 'Express-Server',
        },
      },
    }
  )

  const channel = supabase.channel(`db-realtime`);

  models.forEach((table) => {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table
      },
      (payload) => {
        if (payload.errors?.length) {
          console.error(Logger(`[Realtime] ${table} subscription error: ${payload.errors}`, 'error', 'red'));
          return;
        }

        console.log(Logger(`[Realtime] Change in ${table}: ${JSON.stringify(payload)}`, "info", "cyan"));

        // Broadcast to all Socket.IO clients
        // io.emit("supabase", {
        //   table,
        //   data: payload,
        // });
      }
    );
  });

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      console.log(Logger(`[Realtime] db channel status: ${status}`, 'info', 'green'));
      return;
    }

    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      console.error(Logger(`[Realtime] db channel status: ${status}`, 'error', 'red'));
    }
  });
}
