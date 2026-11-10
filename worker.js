
const ALLOWED_ORIGIN = "https://vikaschatgptai.oneapp.dev";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");

    const headers = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (origin && origin !== ALLOWED_ORIGIN) {
      return new Response("Not allowed", { status: 403 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Use POST" }),
        { status: 405, headers }
      );
    }

    try {
      if (!env.OPENROUTER_API_KEY) {
        throw new Error("API key is not configured");
      }

      const body = await request.json();

      if (!Array.isArray(body.messages)) {
        return new Response(
          JSON.stringify({ error: "Messages are required" }),
          { status: 400, headers }
        );
      }

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": ALLOWED_ORIGIN,
            "X-Title": "VikasChatGptAi"
          },
          body: JSON.stringify({
            model: "openrouter/free",
            messages: body.messages
          })
        }
      );

      const result = await response.text();

      return new Response(result, {
        status: response.status,
        headers
      });

    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers }
      );
    }
  }
};
