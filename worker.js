
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
      return new Response(
        JSON.stringify({ error: "Not allowed" }),
        { status: 403, headers }
      );
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
      const body = await request.json();

      if (!Array.isArray(body.messages) || body.messages.length === 0) {
        return new Response(
          JSON.stringify({ error: "Messages are required" }),
          { status: 400, headers }
        );
      }

      const provider = (env.AI_PROVIDER || "groq").toLowerCase();

      let apiUrl;
      let apiKey;
      let model;

      if (provider === "groq") {
        apiUrl = "https://api.groq.com/openai/v1/chat/completions";
        apiKey = env.GROQ_API_KEY;
        model = env.GROQ_MODEL || "openai/gpt-oss-20b";
      } else if (provider === "openrouter") {
        apiUrl = "https://openrouter.ai/api/v1/chat/completions";
        apiKey = env.OPENROUTER_API_KEY;
        model = env.OPENROUTER_MODEL || "openrouter/free";
      } else {
        return new Response(
          JSON.stringify({ error: "Unsupported AI provider" }),
          { status: 400, headers }
        );
      }

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: provider + " API key is not configured" }),
          { status: 500, headers }
        );
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(provider === "openrouter" ? {
            "HTTP-Referer": ALLOWED_ORIGIN,
            "X-Title": "VikasChatGptAi"
          } : {})
        },
        body: JSON.stringify({
          model,
          messages: body.messages
        })
      });

      const result = await response.text();

      return new Response(result, {
        status: response.status,
        headers
      });

    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message || "Internal server error" }),
        { status: 500, headers }
      );
    }
  }
};
