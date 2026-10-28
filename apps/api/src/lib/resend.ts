export const RESEND_API_KEY =
  process.env.RESEND_API_KEY || "re_3X9D25Dh_FazAt4Eb58bM7AuCGKcF2sm4";
export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Prodgram <noreply@wishelier.in>";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendResendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<{ id: string }> {
  const recipients = Array.isArray(to) ? to : [to];

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: recipients,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Resend Error]", response.status, errorBody);
    throw new Error(`Failed to send email via Resend: ${response.statusText} - ${errorBody}`);
  }

  const data = (await response.json()) as { id: string };
  return data;
}

export function renderEmailTemplate({
  headline,
  subheadline,
  otpCode,
  noticeText,
  footerNote,
}: {
  headline: string;
  subheadline: string;
  otpCode: string;
  noticeText: string;
  footerNote: string;
}) {
  const formattedOtp = otpCode.split("").join("&nbsp;&nbsp;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #090a0f;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #090a0f;
      padding: 40px 15px;
      box-sizing: border-box;
    }
    .card {
      max-width: 520px;
      margin: 0 auto;
      background-color: #11141e;
      border: 1px solid #1e2436;
      border-radius: 12px;
      padding: 36px 32px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #38bdf8;
      text-transform: uppercase;
      margin-bottom: 24px;
    }
    .brand-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #38bdf8;
      border-radius: 50%;
      margin-right: 6px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px 0;
      letter-spacing: -0.4px;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 24px 0;
    }
    .otp-box {
      background: #090a0f;
      border: 1px solid #2d3748;
      border-radius: 8px;
      padding: 20px 16px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: "SF Mono", Monaco, "Courier New", monospace;
      font-size: 32px;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: 8px;
      line-height: 1.2;
    }
    .notice {
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #1e2436;
      padding-top: 18px;
      margin-top: 24px;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      margin-top: 28px;
      font-size: 11px;
      color: #475569;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="brand"><span class="brand-dot"></span>PRODGRAM</div>
      <h1>${headline}</h1>
      <p>${subheadline}</p>
      
      <div class="otp-box">
        <div class="otp-label">Verification Code</div>
        <div class="otp-code">${formattedOtp}</div>
      </div>
      
      <p style="font-size: 13px; color: #94a3b8; margin-bottom: 0;">${noticeText}</p>
      
      <div class="notice">
        ${footerNote}
      </div>
    </div>
    <div class="footer">
      Prodgram · Where real builders launch and users discover · noreply@wishelier.in
    </div>
  </div>
</body>
</html>`;
}

export async function sendVerificationOtpEmail(to: string, otp: string) {
  const html = renderEmailTemplate({
    headline: "Verify your email address",
    subheadline: "Welcome to Prodgram! Use the 6-digit verification code below to confirm your email and complete your account setup.",
    otpCode: otp,
    noticeText: "This verification code will expire in 15 minutes.",
    footerNote: "If you did not sign up for a Prodgram account, you can safely ignore this email. No account will be activated without this verification code.",
  });

  return sendResendEmail({
    to,
    subject: `Your Prodgram verification code: ${otp}`,
    html,
    text: `Your Prodgram verification code is: ${otp}\n\nThis code will expire in 15 minutes. Enter this code on the verification screen to activate your account.`,
  });
}

export async function sendPasswordResetOtpEmail(to: string, otp: string) {
  const html = renderEmailTemplate({
    headline: "Reset your password",
    subheadline: "We received a request to reset the password for your Prodgram account. Enter the 6-digit verification code below to choose a new password.",
    otpCode: otp,
    noticeText: "This reset code will expire in 15 minutes. Never share this code with anyone.",
    footerNote: "If you did not request a password reset, you can safely ignore this email. Your account password remains unchanged.",
  });

  return sendResendEmail({
    to,
    subject: `Your Prodgram password reset code: ${otp}`,
    html,
    text: `Your Prodgram password reset code is: ${otp}\n\nThis code will expire in 15 minutes. If you did not request a password reset, please ignore this email.`,
  });
}
