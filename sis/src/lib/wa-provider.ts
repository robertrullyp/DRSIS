export type WaSendResult = { providerMsgId: string };

export async function sendWaDummy(to: string, text: string): Promise<WaSendResult> {
  // Simulate delivery
  if (!to || !text) throw new Error("invalid wa params");
  // small jitter (no real delay to keep API fast)
  return { providerMsgId: `dummy-${Date.now()}` };
}

export async function sendWa(to: string, text: string): Promise<WaSendResult> {
  const provider = (process.env.WA_PROVIDER || "dummy").toLowerCase();
  switch (provider) {
    case "dummy":
    default:
      return sendWaDummy(to, text);
  }
}

