const express = require("express");
const nodemailer = require("nodemailer");
const validator = require("email-validator");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Debug environment variables
console.log("GMAIL_EMAIL:", process.env.GMAIL_EMAIL);
console.log(
  "GMAIL_APP_PASSWORD:",
  process.env.GMAIL_APP_PASSWORD ? "Set" : "Not set",
);
console.log("EMAIL_FROM:", process.env.EMAIL_FROM);

// Email transporter configuration (using Gmail SMTP)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_EMAIL, // Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // App Password
  },
  logger: true, // Enable logging
  debug: true, // Show SMTP traffic
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Transporter verification failed:", error);
  } else {
    console.log("Transporter is ready to send emails");
  }
});

const processPayment = async (paymentDetails) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (paymentDetails.amount > 0) {
        resolve({
          status: "success",
          transactionId: `TXN-${Date.now()}-${Math.floor(
            Math.random() * 1000,
          )}`,
        });
      } else {
        reject(new Error("Invalid payment amount"));
      }
    }, 1000);
  });
};

const generateInvoiceHTML = (invoiceData) => {
  const { invoiceNumber, transactionId, customerEmail, amount, date } =
    invoiceData;
  const formatCurrency = (value) => `$${parseFloat(value).toFixed(2)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Poridhi Invoice</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
    <h1 style="color: #2a6496; text-align: center; font-size: 24px; margin: 0 0 20px;">Poridhi Invoice</h1>
    <p style="text-align: center; color: #666; font-size: 14px; margin: 0 0 20px;">Thank you for your payment!</p>

    <div style="border-bottom: 1px solid #e0e0e0; padding-bottom: 15px; margin-bottom: 20px;">
      <h2 style="color: #2a6496; font-size: 18px; margin: 0 0 10px;">Invoice Details</h2>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Transaction ID:</strong> ${transactionId}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${date}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Amount:</strong> ${formatCurrency(
        amount,
      )}</p>
    </div>

    <div style="margin-bottom: 20px;">
      <h2 style="color: #2a6496; font-size: 18px; margin: 0 0 10px;">Billed To</h2>
      <p style="margin: 5px 0; font-size: 14px;">${customerEmail}</p>
    </div>

    <div style="margin-bottom: 20px;">
      <h2 style="color: #2a6496; font-size: 18px; margin: 0 0 10px;">From</h2>
      <p style="margin: 5px 0; font-size: 14px;">
        Poridhi<br>
        32, Metropolitan Housing Co-operative Society,<br>
        Mohammadpur, Dhaka-1207<br>
        Email: support@poridhi.com<br>
        Phone: +880 1760-440444
      </p>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f0f0f0; color: #333;">
          <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0;">Description</th>
          <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">Product/Service</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">${formatCurrency(
            amount,
          )}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td style="padding: 10px; font-weight: bold; text-align: right;">Total:</td>
          <td style="padding: 10px; font-weight: bold; text-align: right;">${formatCurrency(
            amount,
          )}</td>
        </tr>
      </tfoot>
    </table>

    <p style="text-align: center; color: #666; font-size: 12px; margin: 20px 0 0;">
      Thank you for your payment. For questions, reply to this email.<br>
      To unsubscribe, email <a href="mailto:unsubscribe@poridhi.com?subject=Unsubscribe" style="color: #2a6496; text-decoration: none;">unsubscribe@poridhi.com</a> with "Unsubscribe" in the subject.
    </p>
  </div>
</body>
</html>
  `.trim();
};

// Function to generate plain text invoice (fallback)
const generateInvoiceText = (invoiceData) => {
  const { invoiceNumber, transactionId, customerEmail, amount, date } =
    invoiceData;
  const formatCurrency = (value) => `$${parseFloat(value).toFixed(2)}`;

  return `
Poridhi Invoice

Invoice Number: ${invoiceNumber}
Transaction ID: ${transactionId}
Date: ${date}
Amount: ${formatCurrency(amount)}

Billed To: ${customerEmail}

From: Poridhi
32, Metropolitan Housing Co-operative Society,
Mohammadpur, Dhaka-1207
Email: support@poridhi.com
Phone: +880 1760-440444

Description: Product/Service
Total: ${formatCurrency(amount)}

Thank you for your payment. For questions, reply to this email.
To unsubscribe, email unsubscribe@poridhi.com with "Unsubscribe" in the subject.
  `.trim();
};

// Function to send email with Gmail SMTP
const sendEmail = async (toEmail, subject, text, html) => {
  if (!validator.validate(toEmail)) {
    throw new Error("Invalid email address");
  }

  const mailOptions = {
    from: `Poridhi <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: subject,
    text: text,
    html: html,
    replyTo: "support@poridhi.com",
    headers: {
      "List-Unsubscribe": `<mailto:unsubscribe@poridhi.com?subject=Unsubscribe>`,
      Precedence: "bulk",
    },
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${toEmail}: ${info.messageId}`);
    console.log("SMTP Response:", info.response);
    console.log("Accepted Recipients:", info.accepted);
    console.log("Rejected Recipients:", info.rejected);
    return info.messageId;
  } catch (error) {
    console.error("Error sending email:", error);
    console.error("SMTP Error Details:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Function to send payment confirmation email
const sendPaymentConfirmationEmail = async (toEmail, transactionId, amount) => {
  const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const invoiceText = generateInvoiceText({
    invoiceNumber,
    transactionId,
    customerEmail: toEmail,
    amount,
    date,
  });

  const invoiceHTML = generateInvoiceHTML({
    invoiceNumber,
    transactionId,
    customerEmail: toEmail,
    amount,
    date,
  });

  const subject = `Poridhi Invoice #${invoiceNumber}`;

  try {
    await sendEmail(toEmail, subject, invoiceText, invoiceHTML);
    return invoiceNumber;
  } catch (error) {
    throw error;
  }
};

// Payment API endpoint
app.post("/api/payment", async (req, res) => {
  const { amount, email } = req.body;

  if (!amount || !email) {
    return res.status(400).json({ error: "Amount and email are required" });
  }

  try {
    const paymentResult = await processPayment({ amount });
    const invoiceNumber = await sendPaymentConfirmationEmail(
      email,
      paymentResult.transactionId,
      amount,
    );

    res.status(200).json({
      message: "Payment successful and invoice sent",
      transactionId: paymentResult.transactionId,
      invoiceNumber,
    });
  } catch (error) {
    console.error("Payment error:", error);
    res
      .status(500)
      .json({ error: error.message || "Payment or email sending failed" });
  }
});

// Test email endpoint
app.post("/api/test-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const subject = "Poridhi Test Email";
  const text = `This is a test email from Poridhi to verify email delivery.\n\nFor questions, reply to this email.\nTo unsubscribe, email unsubscribe@poridhi.com with "Unsubscribe" in the subject.`;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Poridhi Test Email</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
    <h1 style="color: #2a6496; text-align: center; font-size: 24px; margin: 0 0 20px;">Poridhi Test Email</h1>
    <p style="color: #666; font-size: 14px; margin: 0 0 20px;">This is a test email to verify email delivery.</p>
    <p style="color: #666; font-size: 14px; margin: 0 0 20px;">For questions, reply to this email.</p>
    <p style="text-align: center; color: #666; font-size: 12px; margin: 20px 0 0;">
      To unsubscribe, email <a href="mailto:unsubscribe@poridhi.com?subject=Unsubscribe" style="color: #2a6496; text-decoration: none;">unsubscribe@poridhi.com</a> with "Unsubscribe" in the subject.
    </p>
  </div>
</body>
</html>
  `.trim();

  try {
    const messageId = await sendEmail(email, subject, text, html);
    res.status(200).json({
      message: "Test email sent successfully",
      messageId,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({
      error: "Failed to send test email",
      details: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
