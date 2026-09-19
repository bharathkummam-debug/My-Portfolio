const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(__dirname));




// Simple In-Memory Rate Limiting & Duplicate Prevention
const rateLimitMap = new Map();
const recentSubmissions = new Map();

const isRateLimited = (ip) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 mins
  const maxRequests = 30; // Increased limit for user testing

  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    rateLimitMap.set(ip, record);
    return false;
  }

  record.count += 1;
  rateLimitMap.set(ip, record);
  return record.count > maxRequests;
};

// Input Sanitization Helper (XSS Protection)
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

// Real-time SSE Admin Connections
const sseClients = new Set();

const broadcastNewMessage = (messageObj) => {
  const data = `data: ${JSON.stringify({ type: 'new_message', data: messageObj })}\n\n`;
  for (const client of sseClients) {
    client.write(data);
  }
};

// Transporter Factory
const createTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== 'false';

  if (!user || !pass) {
    return null; // Local development mode without active SMTP credentials
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

// ==========================================================================
// PREMIUM EMAIL TEMPLATE GENERATOR (Email-Safe HTML & Inline CSS)
// ==========================================================================
const generateEmailHtml = ({ name, email, message, createdAt, portfolioUrl }) => {
  const subDate = new Date(createdAt);

  // Dynamic Date Formatting (e.g. Sep 12, 2026)
  const dateStr = subDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Dynamic Time Formatting (e.g. 03:35 PM)
  const timeStr = subDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const replySubject = encodeURIComponent(`Re: UI/UX Design Inquiry`);
  const replyMailto = `mailto:${email}?subject=${replySubject}`;

  // Email-Safe Vector SVG Icons (Resolves OS emoji bugs across Gmail, Outlook, Windows Mail)
  const mailIconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;

  const heroMailIconSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;

  const calendarIconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

  const personIconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

  const clockIconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

  const linkIconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

  const msgBubbleSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

  const paperPlaneSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;

  const extLinkSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Portfolio Inquiry</title>
  <style>
    /* Mobile responsive overrides for supporting email clients */
    @media only screen and (max-width: 660px) {
      .email-container {
        width: 100% !important;
        padding: 24px 18px !important;
        border-radius: 16px !important;
      }
      .responsive-col {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 12px 0 !important;
      }
      .col-divider {
        display: none !important;
      }
      .col-border-bottom {
        border-bottom: 1px solid #e2e8f0 !important;
      }
      .btn-container {
        display: block !important;
        width: 100% !important;
      }
      .btn-cell {
        display: block !important;
        width: 100% !important;
        margin-bottom: 12px !important;
        padding-right: 0 !important;
      }
      .btn-action {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .header-right {
        margin-top: 12px !important;
        display: block !important;
      }
      .hero-right-col {
        margin-top: 16px !important;
        display: block !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Outer Canvas Table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f4f6fa" style="background-color: #f4f6fa; padding: 40px 12px;">
    <tr>
      <td align="center">

        <!-- Centered Main Email Card (Generous 660px Width) -->
        <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="660" bgcolor="#ffffff" style="background-color: #ffffff; width: 660px; border-radius: 24px; border: 1px solid #e7eaf0; box-shadow: 0 16px 45px rgba(15, 23, 42, 0.06); padding: 36px 40px;">
          
          <!-- 1. HEADER SECTION -->
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px; line-height: 1.1;">
                      BHARATH<span style="color: #4f46e5;">.</span>
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 2px; margin-top: 5px; text-transform: uppercase;">
                      UI / UX DESIGNER
                    </div>
                  </td>
                  <td align="right" class="header-right" style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #eef2ff; border: 1px solid #e0e7ff; border-radius: 20px; padding: 7px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; color: #4f46e5; white-space: nowrap;">
                          <span style="margin-right: 6px; display: inline-block; vertical-align: middle;">${mailIconSvg}</span>
                          <span style="vertical-align: middle;">New Inquiry</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- THIN DIVIDER -->
          <tr>
            <td style="padding-top: 24px; padding-bottom: 28px;">
              <div style="border-top: 1px solid #f1f5f9; height: 1px; line-height: 1px; font-size: 1px;">&nbsp;</div>
            </td>
          </tr>

          <!-- 2. MAIN HERO TITLE SECTION -->
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 16px;">
                          <div style="background-color: #eef2ff; border-radius: 16px; width: 50px; height: 50px; text-align: center; line-height: 50px; display: inline-block;">
                            ${heroMailIconSvg}
                          </div>
                        </td>
                        <td style="vertical-align: middle;">
                          <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1.2;">
                            New Portfolio <span style="color: #4f46e5;">Inquiry</span>
                          </h1>
                          <p style="margin: 4px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #64748b; font-weight: 500;">
                            Someone is interested in working with you.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" class="hero-right-col" style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 14px; padding: 10px 16px;">
                      <tr>
                        <td style="padding-right: 10px; vertical-align: middle;">
                          ${calendarIconSvg}
                        </td>
                        <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; text-align: right;">
                          <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${dateStr}</div>
                          <div style="color: #64748b; font-size: 12px; margin-top: 2px;">${timeStr}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 3. VISITOR INFORMATION CARD (3 COLUMNS WITH BALANCED SPACING) -->
          <tr>
            <td style="padding-top: 28px; padding-bottom: 28px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f8fafc" style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 18px; padding: 22px 24px;">
                <tr>
                  
                  <!-- COLUMN 1: FROM (Width: 38%) -->
                  <td class="responsive-col col-border-bottom" width="38%" style="vertical-align: top; width: 38%; padding-right: 12px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="vertical-align: middle; width: 34px; padding-right: 10px;">
                          <div style="background-color: #e0e7ff; border-radius: 50%; width: 34px; height: 34px; text-align: center; line-height: 34px;">
                            ${personIconSvg}
                          </div>
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px;">From</div>
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px; line-height: 1.2; white-space: nowrap;">${name}</div>
                          <div style="margin-top: 3px;">
                            <a href="mailto:${email}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #4f46e5; text-decoration: none; word-break: break-all; font-weight: 500;">${email}</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- DIVIDER 1 -->
                  <td class="col-divider" width="2%" style="vertical-align: middle; text-align: center; width: 2%;">
                    <div style="border-left: 1px solid #e2e8f0; height: 44px; margin: 0 auto;"></div>
                  </td>

                  <!-- COLUMN 2: RECEIVED (Width: 28%) -->
                  <td class="responsive-col col-border-bottom" width="28%" style="vertical-align: top; width: 28%; padding-left: 12px; padding-right: 12px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="vertical-align: middle; width: 34px; padding-right: 10px;">
                          <div style="background-color: #e0e7ff; border-radius: 50%; width: 34px; height: 34px; text-align: center; line-height: 34px;">
                            ${clockIconSvg}
                          </div>
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px;">Received</div>
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">${dateStr}</div>
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 500; margin-top: 2px;">${timeStr}</div>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- DIVIDER 2 -->
                  <td class="col-divider" width="2%" style="vertical-align: middle; text-align: center; width: 2%;">
                    <div style="border-left: 1px solid #e2e8f0; height: 44px; margin: 0 auto;"></div>
                  </td>

                  <!-- COLUMN 3: PORTFOLIO URL (Width: 30%) -->
                  <td class="responsive-col" width="30%" style="vertical-align: top; width: 30%; padding-left: 12px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="vertical-align: middle; width: 34px; padding-right: 10px;">
                          <div style="background-color: #e0e7ff; border-radius: 50%; width: 34px; height: 34px; text-align: center; line-height: 34px;">
                            ${linkIconSvg}
                          </div>
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px;">Portfolio URL</div>
                          <div style="margin-top: 3px;">
                            <a href="${portfolioUrl}" target="_blank" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #4f46e5; text-decoration: none; word-break: break-all; font-weight: 600;">${portfolioUrl} &nearr;</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>

                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. MESSAGE SECTION -->
          <tr>
            <td>
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 12px;">
                <span style="margin-right: 8px; display: inline-block; vertical-align: middle;">${msgBubbleSvg}</span>
                <span style="vertical-align: middle;">Message</span>
              </div>

              <!-- Message Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f8fafc" style="background-color: #f8fafc; border: 1px solid #ede9fe; border-radius: 18px; padding: 24px 28px;">
                <tr>
                  <td style="vertical-align: top; width: 30px; padding-right: 14px;">
                    <span style="font-family: Georgia, serif; font-size: 44px; line-height: 0.9; color: #a5b4fc; font-weight: bold;">“</span>
                  </td>
                  <td style="vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.65; color: #334155; white-space: pre-wrap; font-style: italic;">${message}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 5. ACTION BUTTONS SECTION -->
          <tr>
            <td style="padding-top: 32px;">
              <table class="btn-container" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Primary Button: Reply -->
                  <td class="btn-cell" style="padding-right: 14px;">
                    <a href="${replyMailto}" class="btn-action" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 700; text-decoration: none; padding: 13px 26px; border-radius: 30px; border: 1px solid #0f172a; text-align: center; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.15); white-space: nowrap;">
                      <span style="margin-right: 8px; display: inline-block; vertical-align: middle;">${paperPlaneSvg}</span>
                      <span style="vertical-align: middle;">Reply to ${name} &rarr;</span>
                    </a>
                  </td>
                  
                  <!-- Secondary Button: View Portfolio -->
                  <td class="btn-cell">
                    <a href="${portfolioUrl}" target="_blank" class="btn-action" style="display: inline-block; background-color: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 700; text-decoration: none; padding: 13px 26px; border-radius: 30px; border: 1px solid #cbd5e1; text-align: center; white-space: nowrap;">
                      <span style="margin-right: 8px; display: inline-block; vertical-align: middle;">${extLinkSvg}</span>
                      <span style="vertical-align: middle;">View Portfolio &rarr;</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
};

// ==========================================================================
// IN-MEMORY MESSAGING STORE
// ==========================================================================

const inMemoryMessages = [];

const saveMessageToDb = async (messageRecord) => {
  inMemoryMessages.unshift(messageRecord);
  return messageRecord;
};

const fetchMessagesFromDb = async (statusFilter) => {
  if (statusFilter) {
    return inMemoryMessages.filter(m => m.status === statusFilter);
  }
  return inMemoryMessages;
};

const updateMessageStatusInDb = async (id, status) => {
  const msg = inMemoryMessages.find(m => m.id === id);
  if (msg) {
    msg.status = status;
    return true;
  }
  return false;
};



// ==========================================================================
// API ENDPOINTS
// ==========================================================================

// 1. Submit Contact Form Message
app.post('/api/contact', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // Rate Limiting Check
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: 'Too many message requests. Please try again in 15 minutes.'
    });
  }

  let { name, email, message } = req.body;

  // Input Sanitization
  name = sanitizeInput(name);
  email = sanitizeInput(email);
  message = sanitizeInput(message);

  // Server-Side Validation
  const errors = {};

  if (!name || name.length < 2) {
    errors.name = 'Name must be at least 2 characters long.';
  } else if (name.length > 100) {
    errors.name = 'Name cannot exceed 100 characters.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!message || message.length < 10) {
    errors.message = 'Message must be at least 10 characters long.';
  } else if (message.length > 3000) {
    errors.message = 'Message cannot exceed 3000 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  // Duplicate Submission Prevention (Check within 5s)
  const dupKey = `${email}:${message}`;
  const now = Date.now();
  if (recentSubmissions.has(dupKey) && (now - recentSubmissions.get(dupKey)) < 5000) {
    return res.status(400).json({
      error: 'Duplicate submission detected. Please wait a moment before sending again.'
    });
  }
  recentSubmissions.set(dupKey, now);

  // Construct Message Object
  const id = 'msg_' + crypto.randomBytes(8).toString('hex');
  const createdAt = new Date().toISOString();
  const status = 'new';

  const messageRecord = { id, name, email, message, createdAt, status, ip: clientIp };

  try {
    // Save to Database (MongoDB Cloud or SQLite Local)
    await saveMessageToDb(messageRecord);

    // Broadcast Realtime SSE Event
    broadcastNewMessage(messageRecord);

    // Send Email Notification to Gmail
    const ownerEmail = process.env.OWNER_EMAIL || 'kummambharath@gmail.com';

    // Resolve production portfolio URL
    let portfolioUrl = process.env.PORTFOLIO_URL;
    if (!portfolioUrl || portfolioUrl.includes('localhost') || portfolioUrl.includes('127.0.0.1')) {
      portfolioUrl = process.env.PRODUCTION_PORTFOLIO_URL || 'https://bharath-portfolio.com';
    }

    const transporter = createTransporter();

    const emailSubject = `New Portfolio Message — ${name}`;
    const emailHtml = generateEmailHtml({ name, email, message, createdAt, portfolioUrl });

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Portfolio Messaging" <${process.env.SMTP_USER}>`,
          to: ownerEmail,
          replyTo: email,
          subject: emailSubject,
          html: emailHtml,
        });
        console.log(`[Email Delivered] Notification sent to ${ownerEmail} for message ${id}`);
      } catch (mailErr) {
        console.error('[Email Warning] Failed to send email via SMTP:', mailErr.message);
      }
    } else {
      console.log(`[Local Simulation Mode] SMTP credentials not set in .env. Message ${id} saved to DB successfully.`);
    }

    return res.status(201).json({
      success: true,
      message: 'Message Sent ✓',
      data: { id, createdAt }
    });

  } catch (err) {
    console.error('Database Error:', err.message);
    return res.status(500).json({ error: 'Failed to persist message to database. Please try again.' });
  }
});

// 2. GET All Messages (Admin Endpoint)
app.get('/api/messages', async (req, res) => {
  const { status } = req.query;
  try {
    const messages = await fetchMessagesFromDb(status);
    res.json({ success: true, count: messages.length, messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// 3. PATCH Update Message Status (Admin Endpoint)
app.patch('/api/messages/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['new', 'read', 'replied'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value. Must be new, read, or replied.' });
  }

  try {
    const updated = await updateMessageStatusInDb(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ success: true, id, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message status' });
  }
});


// 4. SSE Real-Time Stream Endpoint for Admin Dashboard
app.get('/api/messages/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE Stream Connected' })}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`Portfolio Server running at: http://localhost:${PORT}`);
  console.log(`API Endpoint: http://localhost:${PORT}/api/contact`);
  console.log(`==================================================`);
});


app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
