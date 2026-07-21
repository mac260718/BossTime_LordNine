const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return json(500, { error: "DISCORD_WEBHOOK_URL is not set" });
  }

  let payload = {};
  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch (error) {
    return json(400, { error: "Invalid JSON" });
  }

  const content = String(payload.content || "").trim().slice(0, 1900);
  if (!content) {
    return json(400, { error: "content is required" });
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
      allowed_mentions: {
        parse: Array.isArray(payload.mentions) ? payload.mentions : [],
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return json(502, {
      error: "Discord webhook failed",
      status: response.status,
      detail: detail.slice(0, 500),
    });
  }

  return json(200, { ok: true });
};
