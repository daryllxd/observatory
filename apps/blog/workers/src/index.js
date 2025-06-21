export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle GET requests for viewing stats
    if (request.method === "GET") {
      try {
        // Get all keys from KV
        const keys = await env.ANALYTICS.list();

        // Fetch values for all keys
        const stats = await Promise.all(
          keys.keys.map(async (key) => {
            const value = await env.ANALYTICS.get(key.name);
            return {
              key: key.name,
              value: parseInt(value) || 0,
            };
          })
        );

        // Group by date and path
        const groupedStats = stats.reduce((acc, { key, value }) => {
          const [_, date, path] = key.split(":");
          if (!acc[date]) acc[date] = {};
          acc[date][path] = value;
          return acc;
        }, {});

        return new Response(JSON.stringify(groupedStats, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
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
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  },
};
