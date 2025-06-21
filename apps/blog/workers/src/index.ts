export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);

    // Log the env object and its properties
    console.log("request", request.url);
    console.log("Environment object:", env);
    console.log("KV namespace binding:", env.ANALYTICS);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle OPTIONS (CORS preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Handle GET requests for viewing stats
    if (request.method === "GET") {
      try {
        console.log("Received GET request for analytics stats", env);

        // Get all keys from KV
        const keys = await env.ANALYTICS.list();
        console.log("KV keys:", keys);

        // Fetch values for all keys
        const stats = await Promise.all(
          keys.keys.map(async (key: any) => {
            const value = await env.ANALYTICS.get(key.name);
            console.log(`Fetched value for key ${key.name}:`, value);
            return {
              key: key.name,
              value: parseInt(value) || 0,
            };
          })
        );

        // Group by date and path
        const groupedStats = stats.reduce((acc: any, { key, value }: any) => {
          const [_, date, path] = key.split(":");
          if (!acc[date]) acc[date] = {};
          acc[date][path] = value;
          return acc;
        }, {});

        console.log("Grouped stats:", groupedStats);

        return new Response(JSON.stringify(groupedStats, null, 2), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (error: any) {
        console.error("Error in GET handler:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Handle POST requests for tracking
    if (request.method === "POST") {
      try {
        const path = url.pathname;
        const date = new Date().toISOString().split("T")[0];
        const key = `analytics:${date}:${path}`;

        let count = (await env.ANALYTICS.get(key)) || 0;
        count = parseInt(count) + 1;
        await env.ANALYTICS.put(key, count.toString());

        return new Response(JSON.stringify({ success: true, count }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  },
};
