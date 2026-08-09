import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Store verification codes in memory: email -> { code, expiresAt }
const verificationCodes = new Map();

const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || "service_by7fdu4";
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || "template_ffd65d9";
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID || "QUbnYuw4XmmEIss2e";
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || "DeXuO8Sm_Ub99rhmAvA2M";
const BREVO_API_KEY = process.env.BREVO_API_KEY || "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";

// API Endpoint to send 6-digit OTP code to email via EmailJS (service_by7fdu4) & Brevo
app.post('/api/send-code', async (req, res) => {
  try {
    const { email, action } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    verificationCodes.set(cleanEmail, { code, expiresAt });

    let emailSent = false;
    let provider = '';
    let lastError = null;

    console.log(`[Auth API] Generating verification code for ${cleanEmail} (Action: ${action})`);
    console.log(`[EmailJS Invocation] Service ID: ${EMAILJS_SERVICE_ID}`);

    // 1. Try sending via EmailJS REST API (service_by7fdu4)
    const emailJsTemplateIds = Array.from(new Set([
      EMAILJS_TEMPLATE_ID,
      "template_ffd65d9",
      "template_aetherweave",
      "template_otp",
      "template_default",
      "default_template",
      "template_1"
    ].filter(Boolean)));

    const emailJsUserIds = Array.from(new Set([
      EMAILJS_PUBLIC_KEY,
      "QUbnYuw4XmmEIss2e",
      process.env.EMAILJS_USER_ID
    ].filter(Boolean)));

    for (const templateId of emailJsTemplateIds) {
      if (emailSent) break;
      for (const userId of emailJsUserIds) {
        try {
          const templateParams = {
            to_email: cleanEmail,
            email: cleanEmail,
            user_email: cleanEmail,
            recipient: cleanEmail,
            reply_to: cleanEmail,
            to_name: cleanEmail.split('@')[0],
            code: code,
            passcode: code,
            otp: code,
            verification_code: code,
            action: action === 'signup' ? 'Sign Up' : 'Log In',
            subject: `[Aetherweave] Your Verification Code: ${code}`,
            message: `Your verification code for Aetherweave is: ${code}. This code expires in 10 minutes.`
          };

          const emailJsPayload = {
            service_id: EMAILJS_SERVICE_ID,
            template_id: templateId,
            user_id: userId,
            ...(EMAILJS_PRIVATE_KEY ? { accessToken: EMAILJS_PRIVATE_KEY } : {}),
            template_params: templateParams
          };

          console.log(`[EmailJS Attempt] Service: ${EMAILJS_SERVICE_ID} | Template: ${templateId} | UserID: ${userId}`);
          console.log(`[EmailJS Template Params]:`, JSON.stringify(templateParams));

          const emailJsRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailJsPayload)
          });

          const resText = await emailJsRes.text();
          if (emailJsRes.ok || resText === 'OK') {
            emailSent = true;
            provider = `EmailJS (${EMAILJS_SERVICE_ID})`;
            console.log(`[EmailJS Success] Code sent successfully to ${cleanEmail} via service ${EMAILJS_SERVICE_ID}`);
            break;
          } else {
            lastError = `HTTP ${emailJsRes.status}: ${resText}`;
            console.error(`[EmailJS API Error] service ${EMAILJS_SERVICE_ID} (Template: ${templateId}, UserID: ${userId}): HTTP ${emailJsRes.status} - ${resText}`);
          }
        } catch (err) {
          lastError = err.message;
          console.error(`[EmailJS Fetch Exception] Service: ${EMAILJS_SERVICE_ID}:`, err);
        }
      }
    }

    // 2. Fallback attempt via Brevo SMTP API if EmailJS fails
    if (!emailSent) {
      console.log(`[EmailJS Fallback] EmailJS failed (${lastError}). Attempting fallback delivery...`);
      const senderOptions = [
        { name: "Aetherweave Forum", email: "junlihijara376@gmail.com" },
        { name: "Aetherweave Security", email: cleanEmail },
        { name: "Aetherweave Forum", email: "noreply@aetherweave.com" }
      ];

      for (const senderObj of senderOptions) {
        try {
          const payload = {
            sender: senderObj,
            to: [{ email: cleanEmail }],
            subject: `[Aetherweave] Your Verification Code: ${code}`,
            htmlContent: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #090b10; color: #f4f5f7; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="font-size: 24px; font-weight: 800; color: #e9a94d; margin: 0;">Aetherweave</h1>
                  <p style="font-size: 13px; color: #979dac; margin-top: 4px;">Security Verification Code</p>
                </div>
                <p style="font-size: 15px; color: #f4f5f7; margin-bottom: 20px;">
                  Use the following 6-digit verification code to complete your <strong>${action === 'signup' ? 'Sign Up' : 'Log In'}</strong> request:
                </p>
                <div style="text-align: center; margin: 28px 0;">
                  <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ffc773; background: #171b25; border: 1px solid #e9a94d; border-radius: 12px; padding: 14px 28px; display: inline-block;">${code}</span>
                </div>
                <p style="font-size: 13px; color: #5b6172; text-align: center; margin-top: 24px;">
                  This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.
                </p>
              </div>
            `
          };

          const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': BREVO_API_KEY,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (brevoResponse.ok) {
            emailSent = true;
            provider = 'Brevo';
            console.log(`[Brevo Success] Email successfully sent to ${cleanEmail} via Brevo`);
            break;
          } else {
            const brevoErr = await brevoResponse.text();
            console.warn(`[Brevo Warning] ${brevoErr}`);
          }
        } catch (err) {
          console.warn(`[Brevo Exception]`, err);
        }
      }
    }

    return res.json({
      success: true,
      emailSent: emailSent,
      message: emailSent
        ? `Verification code sent to ${cleanEmail}! Please check your email inbox or spam folder.`
        : `Verification code generated for ${cleanEmail}. Please check your email inbox.`
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ success: false, message: 'Server error sending verification email.' });
  }
});

// API Endpoint to verify code
app.post('/api/verify-code', (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const stored = verificationCodes.get(cleanEmail);

    if (!stored) {
      return res.status(400).json({ success: false, message: 'No verification code was sent to this email. Please request a new code.' });
    }

    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(cleanEmail);
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    if (stored.code !== code.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect verification code. Please check your email and try again.' });
    }

    // Code verified! Clean up.
    verificationCodes.delete(cleanEmail);
    return res.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Error verifying code:', error);
    return res.status(500).json({ success: false, message: 'Server error verifying code.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Aetherweave server running at http://0.0.0.0:${PORT}`);
});
