Email Notification Service

This Node.js application sends invoice emails using nodemailer, supporting both plain text and HTML formats. It was initially configured with Gmail SMTP but faced spam issues due to low sender reputation. 

Features





Endpoints:





POST /api/payment: Process payment and send invoice email.



POST /api/test-email: Send test email.



Options: Use ?usePlainText=true for plain text emails to reduce spam risk.



Compliance: Includes unsubscribe link and spam-avoidance headers.



Goal: Send emails/day with high inbox placement.

Prerequisites





Node.js v16+



Gmail account with 2-Step Verification and App Password 



Dependencies: express, nodemailer, dotenv, email-validator

Setup





Clone the Repository:

git clone <repository-url>
cd notification



Install Dependencies:

npm install



Configure Environment: Create .env in the project root:

PORT=3000
GMAIL_EMAIL=your@gmail.com
GMAIL_APP_PASSWORD=your_app_password
EMAIL_FROM=your@gmail.com





For Gmail: Generate an App Password at Google Account Security.






Start the Server:

node server.js

Usage





Send Test Email:

curl -X POST http://localhost:3000/api/test-email -H "Content-Type: application/json" -d '{"email": "recipient@example.com"}'





Plain text: Add ?usePlainText=true.



Send Payment Invoice:

curl -X POST http://localhost:3000/api/payment -H "Content-Type: application/json" -d '{"amount": 100, "email": "recipient@example.com"}'

Notes





Gmail Issues: Emails from @gmail.com often land in spam due to low reputation. Use plain text (usePlainText=true) or switch to Zoho Mail.





Troubleshooting





Authentication: Verify .env and App Password.



Spam: Test with Mail-Tester, warm up sender (5-10 emails/day).



Logs: Check console for SMTP errors or rejected recipients.