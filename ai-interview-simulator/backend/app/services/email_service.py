import os
from dotenv import load_dotenv
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from aiosmtplib import SMTP

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path)

SMTP_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('MAIL_PORT', '587'))
SMTP_USERNAME = os.getenv('soniraj02082006@gmail.com', '')
SMTP_PASSWORD = os.getenv('igtdkzsrtyncusdj', '')
MAIL_FROM = os.getenv('soniraj02082006@gmail.combut ', SMTP_USERNAME)

async def send_otp_email(to_email: str, otp: str):
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        raise ValueError('SMTP credentials are not configured. Set MAIL_USERNAME and MAIL_PASSWORD in your .env file.')

    message = MIMEMultipart('alternative')
    message['From'] = MAIL_FROM
    message['To'] = to_email
    message['Subject'] = 'AI Interview Simulator - Verification Code'

    html_body = f"""
    <html>
      <body>
        <p>Hello,</p>
        <p>Your AI Interview Simulator verification code is:</p>
        <h2>{otp}</h2>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this code, please ignore this message.</p>
      </body>
    </html>
    """

    message.attach(MIMEText(html_body, 'html'))

    smtp = SMTP(hostname=SMTP_SERVER, port=SMTP_PORT)
    await smtp.connect()

    if SMTP_PORT == 587:
        await smtp.starttls()

    await smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
    await smtp.send_message(message)
    await smtp.quit()
    print(f"[GMAIL] Verification email sent to {to_email}")

