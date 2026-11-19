export const requiredGoogleSheetsEnvVars = [
  "GOOGLE_SHEETS_SPREADSHEET_ID",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
];

export const missingEnvVars = (names, env = process.env) =>
  names.filter((name) => !env[name]);

export const getGooglePrivateKey = (env = process.env) =>
  env.GOOGLE_PRIVATE_KEY ? env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n") : "";

export const googleSheetsConfigStatus = (env = process.env) => {
  const missing = missingEnvVars(requiredGoogleSheetsEnvVars, env);

  return {
    configured: missing.length === 0,
    missing,
  };
};

export function matchesPaypalReceiver(params, env = process.env) {
  const expected = (env.PAYPAL_RECEIVER_EMAIL || env.PAYPAL_BUSINESS || "").trim();
  if (!expected) return true;

  if (env.PAYPAL_RECEIVER_EMAIL || expected.includes("@")) {
    const email = params.get("receiver_email") || params.get("business") || "";
    return email.trim().toLowerCase() === expected.toLowerCase();
  }

  const merchantId = params.get("receiver_id") || params.get("business") || "";
  return merchantId === expected;
}
