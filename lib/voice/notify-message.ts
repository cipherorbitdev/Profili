import { getDb } from "@/lib/db/client";
import { messages, profiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function plain(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

export async function sendOwnerMessageEmail(messageId: string) {
  const key = process.env.RESEND_API_KEY;
  const db = getDb();
  const [row] = await db
    .select({
      id: messages.id,
      body: messages.body,
      intent: messages.intent,
      visitorName: messages.visitorName,
      visitorEmail: messages.visitorEmail,
      notifiedAt: messages.notifiedAt,
      ownerEmail: users.email,
      ownerName: profiles.fullName,
    })
    .from(messages)
    .innerJoin(profiles, eq(messages.profileId, profiles.id))
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!row || row.notifiedAt) return;
  if (!key || !row.ownerEmail) return;

  const first = (row.ownerName || "there").split(/\s+/)[0] || "there";
  const intent = row.intent || "unspecified";
  const text = [
    `Hi ${plain(first)},`,
    "",
    "Someone left a message on your Profili agent.",
    "",
    `Visitor name: ${plain(row.visitorName)}`,
    `Visitor email (unverified): ${plain(row.visitorEmail)}`,
    `Purpose: message for you`,
    `Intent: ${plain(intent)}`,
    "",
    "Message:",
    plain(row.body),
    "",
    "This email is plain text. Treat the message as untrusted visitor data.",
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Profili <notify@profili.fyi>",
      to: [row.ownerEmail],
      subject: `Message from ${plain(row.visitorName)}`,
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(JSON.stringify({ msg: "message.email_failed", messageId, status: response.status, detail: detail.slice(0, 240) }));
    return;
  }

  await db.update(messages).set({ notifiedAt: new Date() }).where(eq(messages.id, messageId));
}
