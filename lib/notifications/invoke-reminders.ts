/**
 * Invokes the Supabase Edge Function that evaluates learning-reminder rules.
 * Used by admin "Run reminders now" for QA.
 */
export async function invokeLearningReminders(): Promise<{
  ok: boolean;
  status: number;
  body: string;
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  const response = await fetch(
    `${url}/functions/v1/send-learning-reminders`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source: "admin" }),
    },
  );

  const body = await response.text();
  return { ok: response.ok, status: response.status, body };
}
