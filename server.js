import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ==============================
// MAIL CONFIG
// ==============================
// Use environment variables
const emailUser = process.env.EMAIL_USER || "bossremo665@gmail.com";
const emailPass = process.env.EMAIL_PASS || "gmksfowbjmacjsot";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPass
  },
  debug: true,
  logger: true,
  tls: {
    rejectUnauthorized: false
  }
});

// Verify the connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Error:", error);
  } else {
    console.log("🚀 SMTP Server is ready to send emails");
  }
});

// ==============================
// SEND OTP
// ==============================
app.post("/send-otp", async (req, res) => {
  const { email, name, expectedOtp } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  // Log exactly what is happening in the terminal
  console.log("-----------------------------------------");
  console.log("OTP REQUEST RECEIVED");
  console.log("To Email:", email);
  console.log("To Name:", name);
  console.log("OTP Code:", expectedOtp);
  console.log("-----------------------------------------");

  const mailOptions = {
    from: `"NeoBank Secure" <${emailUser}>`,
    to: email, 
    subject: "NeoBank - Your OTP Verification Code",
    html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">NeoBank Identity Verification</h2>
          <p>Hi ${name ? name.split(' ')[0] : 'there'},</p>
          <p>Please use the following 4-digit code to verify your email address. Do not share this code with anyone.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 40px; letter-spacing: 10px; color: #1d4ed8; margin: 0;">${expectedOtp}</h1>
          </div>
          <p style="font-size: 12px; color: #6b7280; text-align: center;">Sent by bossremo665@gmail.com</p>
        </div>
      `
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("Response:", info.response);

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("❌ ERROR FAILED TO SEND EMAIL");
    console.error(err);

    res.status(500).json({
      error: "Failed to send email",
      details: err.message
    });
  }
});

// ==============================
// START SERVER
// ==============================
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Email Backend running on http://localhost:${PORT}`);
  console.log(`Sending emails as: bossremo665@gmail.com`);
});
