export type WhatsAppSendResult = {
  data: unknown;
  messageId?: string;
  status: number;
};

export type MetaErrorDetail = {
  code?: number | string;
  message: string;
  error_subcode?: number | string;
  type?: string;
  fbtrace_id?: string;
};

// ── Multi-tenant: resuelve accessToken y phoneNumberId por tenant ──
import prisma from "@/lib/prisma";

type ResolvedConfig = {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
  graphApiVersion: string;
};

async function resolveTenantConfig(
  tenantId?: string | null
): Promise<ResolvedConfig> {
  // Si hay tenantId, buscar en DB
  if (tenantId) {
    const mapping = await prisma.whatsAppTenantMapping.findUnique({
      where: { tenantId },
      select: {
        accessToken: true,
        phoneNumberId: true,
        waBusinessId: true,
        isActive: true,
      },
    });

    if (!mapping) {
      console.error("[WHATSAPP] No tenant mapping found", { tenantId });
      throw new Error(
        `WhatsApp tenant mapping not found for tenant: ${tenantId}`
      );
    }

    if (!mapping.isActive) {
      console.error("[WHATSAPP] Tenant mapping is inactive", { tenantId });
      throw new Error(
        `WhatsApp tenant mapping is inactive for tenant: ${tenantId}`
      );
    }

    if (!mapping.accessToken) {
      console.error("[WHATSAPP] Tenant mapping has no accessToken", {
        tenantId,
      });
      throw new Error(
        `WhatsApp access token not configured for tenant: ${tenantId}`
      );
    }

    const graphApiVersion =
      process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v25.0";

    return {
      accessToken: mapping.accessToken,
      phoneNumberId: mapping.phoneNumberId,
      businessAccountId: mapping.waBusinessId ?? undefined,
      graphApiVersion,
    };
  }

  // Fallback: entorno global (legacy)
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const graphApiVersion =
    process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v25.0";

  if (!phoneNumberId || !accessToken) {
    throw new Error("WhatsApp credentials are not configured.");
  }

  return {
    accessToken,
    phoneNumberId,
    businessAccountId: businessAccountId ?? undefined,
    graphApiVersion,
  };
}

function getWhatsAppConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    graphApiVersion: process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v25.0",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  };
}

export function metaErrorDetail(data: unknown): MetaErrorDetail {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    data.error &&
    typeof data.error === "object" &&
    "message" in data.error
  ) {
    const error = data.error as Record<string, unknown>;

    return {
      code:
        typeof error.code === "number" || typeof error.code === "string"
          ? error.code
          : undefined,
      message:
        typeof error.message === "string"
          ? error.message
          : "Unknown Graph API error",
      error_subcode:
        typeof error.error_subcode === "number" ||
        typeof error.error_subcode === "string"
          ? error.error_subcode
          : undefined,
      type: typeof error.type === "string" ? error.type : undefined,
      fbtrace_id:
        typeof error.fbtrace_id === "string" ? error.fbtrace_id : undefined,
    };
  }

  return { message: "Unknown Graph API error" };
}

function metaMessageId(data: unknown) {
  if (
    data &&
    typeof data === "object" &&
    "messages" in data &&
    Array.isArray(data.messages)
  ) {
    const firstMessage = data.messages[0];

    if (
      firstMessage &&
      typeof firstMessage === "object" &&
      "id" in firstMessage &&
      typeof firstMessage.id === "string"
    ) {
      return firstMessage.id;
    }
  }

  return undefined;
}

async function parseMetaResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export function hasWhatsAppSendConfig() {
  const config = getWhatsAppConfig();

  return Boolean(config.phoneNumberId && config.accessToken);
}

export function logWhatsAppEnvPresence() {
  const config = getWhatsAppConfig();

  console.log("WhatsApp env presence", {
    WHATSAPP_ACCESS_TOKEN: Boolean(config.accessToken),
    WHATSAPP_PHONE_NUMBER_ID: Boolean(config.phoneNumberId),
    WHATSAPP_BUSINESS_ACCOUNT_ID: Boolean(config.businessAccountId),
  });
}

export async function sendWhatsAppMessage(
  recipient: string,
  message: string,
  tenantId?: string | null
): Promise<WhatsAppSendResult> {
  const config = await resolveTenantConfig(tenantId);

  console.log("Sending WhatsApp message", {
    recipient,
    hasTenantId: !!tenantId,
  });

  const response = await fetch(
    `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: {
          body: message,
        },
      }),
    }
  );

  const data = await parseMetaResponse(response);
  console.log("Response:", data);

  if (!response.ok) {
    const detail = metaErrorDetail(data);
    console.error("WhatsApp send failed", {
      status: response.status,
      statusText: response.statusText,
      errorCode: detail.code,
      errorMessage: detail.message,
      errorSubcode: detail.error_subcode,
      metaResponse: data,
    });

    throw Object.assign(new Error(detail.message), {
      statusCode: response.status,
      statusText: response.statusText,
      metaError: detail,
      metaResponse: data,
    });
  }

  return {
    data,
    messageId: metaMessageId(data),
    status: response.status,
  };
}

export async function sendWhatsAppImageMessage(
  recipient: string,
  imageUrl: string,
  caption?: string,
  tenantId?: string | null
): Promise<WhatsAppSendResult> {
  const config = await resolveTenantConfig(tenantId);

  console.log("Sending WhatsApp image message", {
    recipient,
    hasTenantId: !!tenantId,
  });
  console.log("Public image URL used:", imageUrl);

  const imagePayload: { link: string; caption?: string } = {
    link: imageUrl,
  };

  if (caption?.trim()) {
    imagePayload.caption = caption.trim();
  }

  const response = await fetch(
    `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "image",
        image: imagePayload,
      }),
    }
  );

  const data = await parseMetaResponse(response);
  console.log("Meta status:", response.status, response.statusText);
  console.log("Meta response:", data);

  if (!response.ok) {
    const detail = metaErrorDetail(data);
    console.error("WhatsApp image send failed", {
      status: response.status,
      statusText: response.statusText,
      errorCode: detail.code,
      errorMessage: detail.message,
      errorSubcode: detail.error_subcode,
      metaResponse: data,
    });

    throw Object.assign(new Error(detail.message), {
      statusCode: response.status,
      statusText: response.statusText,
      metaError: detail,
      metaResponse: data,
    });
  }

  return {
    data,
    messageId: metaMessageId(data),
    status: response.status,
  };
}

export async function sendWhatsAppReaction(
  recipient: string,
  messageId: string,
  emoji: string,
  tenantId?: string | null
): Promise<WhatsAppSendResult> {
  const config = await resolveTenantConfig(tenantId);

  console.log("Sending WhatsApp reaction", {
    recipient,
    messageId,
    emoji,
    hasTenantId: !!tenantId,
  });

  const response = await fetch(
    `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "reaction",
        reaction: {
          message_id: messageId,
          emoji,
        },
      }),
    }
  );

  const data = await parseMetaResponse(response);
  console.log("Response:", data);

  if (!response.ok) {
    const detail = metaErrorDetail(data);
    console.error("WhatsApp reaction failed", {
      status: response.status,
      statusText: response.statusText,
      errorCode: detail.code,
      errorMessage: detail.message,
      errorSubcode: detail.error_subcode,
      metaResponse: data,
    });

    throw Object.assign(new Error(detail.message), {
      statusCode: response.status,
      statusText: response.statusText,
      metaError: detail,
      metaResponse: data,
    });
  }

  return {
    data,
    messageId: metaMessageId(data),
    status: response.status,
  };
}
