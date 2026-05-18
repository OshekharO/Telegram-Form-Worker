export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  },
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  if (request.method === "GET" && url.pathname === "/") {
    return jsonResponse({
      service: "Telegram Form Service",
      usage: "POST your form to /f/:formName",
      example: "/f/contact",
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        message: "Method not allowed",
      },
      405
    );
  }

  const pathParts = url.pathname.split("/").filter(Boolean);

  if (pathParts[0] !== "f" || !pathParts[1]) {
    return jsonResponse(
      {
        success: false,
        message: "Invalid endpoint. Use /f/:formName",
      },
      404
    );
  }

  const formName = pathParts[1];

  let formData;

  try {
    formData = await parseRequestBody(request);
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        message: "Invalid request body",
      },
      400
    );
  }

  /**
   * Honeypot spam protection.
   * Add this hidden field to your forms:
   *
   * <input type="text" name="_gotcha" style="display:none">
   */
  if (formData._gotcha) {
    return jsonResponse({
      success: true,
      message: "Form submitted successfully",
    });
  }

  const redirectUrl = formData._redirect || null;
  const subject = formData._subject || `New ${formName} form submission`;

  delete formData._gotcha;
  delete formData._redirect;
  delete formData._subject;

  if (Object.keys(formData).length === 0) {
    return jsonResponse(
      {
        success: false,
        message: "No form fields received",
      },
      400
    );
  }

  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "Unknown";

  const userAgent = request.headers.get("User-Agent") || "Unknown";

  const telegramText = buildTelegramMessage({
    formName,
    subject,
    fields: formData,
    ip,
    userAgent,
  });

  const telegramResult = await sendTelegramMessage({
    botToken: env.BOT_TOKEN,
    chatId: env.CHAT_ID,
    text: telegramText,
  });

  if (!telegramResult.ok) {
    return jsonResponse(
      {
        success: false,
        message: "Failed to send message",
        error: telegramResult.description || "Telegram API error",
      },
      500
    );
  }

  if (redirectUrl) {
    return Response.redirect(redirectUrl, 303);
  }

  return jsonResponse({
    success: true,
    message: "Form submitted successfully",
  });
}

async function parseRequestBody(request) {
  const contentType = request.headers.get("Content-Type") || "";

  if (contentType.includes("application/json")) {
    return await request.json();
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const data = await request.formData();
    const fields = {};

    for (const [key, value] of data.entries()) {
      if (typeof value === "string") {
        fields[key] = value;
      } else {
        fields[key] = `[File: ${value.name}, ${value.size} bytes]`;
      }
    }

    return fields;
  }

  throw new Error("Unsupported content type");
}

function buildTelegramMessage({ formName, subject, fields, ip, userAgent }) {
  let text = `<b>${escapeHtml(subject)}</b>\n\n`;
  text += `<b>Form:</b> <code>${escapeHtml(formName)}</code>\n`;
  text += `<b>IP:</b> <code>${escapeHtml(ip)}</code>\n`;
  text += `<b>User Agent:</b> <code>${escapeHtml(userAgent)}</code>\n\n`;

  text += `<b>Submitted Fields:</b>\n`;

  for (const [key, value] of Object.entries(fields)) {
    text += `\n<b>${escapeHtml(key)}:</b>\n<code>${escapeHtml(
      String(value)
    )}</code>\n`;
  }

  return text;
}

async function sendTelegramMessage({ botToken, chatId, text }) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    }
  );

  return await response.json();
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      ...CORS_HEADERS,
    },
  });
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
