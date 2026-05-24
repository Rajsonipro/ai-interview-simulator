import os
from dotenv import load_dotenv
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from aiosmtplib import SMTP

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path)

SMTP_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('MAIL_PORT', '587'))
SMTP_USERNAME = os.getenv('MAIL_USERNAME', '')
SMTP_PASSWORD = os.getenv('MAIL_PASSWORD', '')
MAIL_FROM = os.getenv('MAIL_FROM', SMTP_USERNAME)


def _build_html_body(otp: str, purpose: str = "verification") -> str:
    """Build a styled HTML email body for OTP messages."""
    if purpose == "forgot_password":
        title = "Password Reset Code"
        subtitle = "You requested to reset your password. Use the code below to proceed."
        footer = "If you didn't request a password reset, ignore this email."
    else:
        title = "Your OTP Code"
        subtitle = "Thank you for registering! Use the code below to verify your email address."
        footer = "This code expires in 10 minutes. If you didn't request this, ignore it."

    return f"""
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f7f6;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">{title}</h1>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">{subtitle}</p>
          <div style="background: #F3F4F6; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #4F46E5; font-family: 'Courier New', monospace;">
              {otp}
            </div>
          </div>
          <p style="color: #6B7280; font-size: 14px; margin-bottom: 8px;">{footer}</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">AI Interview Simulator</p>
        </div>
      </body>
    </html>
    """


async def send_otp_email(to_email: str, otp: str, purpose: str = "verification"):
    """Send an OTP email via SMTP to the given email address."""
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        raise ValueError(
            'SMTP credentials not configured. Set MAIL_USERNAME and MAIL_PASSWORD in your .env file.'
        )

    subject_map = {
        "verification": "AI Interview Simulator - Verify Your Email",
        "forgot_password": "AI Interview Simulator - Password Reset Code",
    }
    subject = subject_map.get(purpose, "AI Interview Simulator - Verification Code")

    message = MIMEMultipart('alternative')
    message['From'] = MAIL_FROM
    message['To'] = to_email
    message['Subject'] = subject

    html_body = _build_html_body(otp, purpose)
    message.attach(MIMEText(html_body, 'html'))

    smtp = SMTP(hostname=SMTP_SERVER, port=SMTP_PORT)
    await smtp.connect()

    if SMTP_PORT == 587:
        try:
            await smtp.starttls()
        except Exception:
            pass

    await smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
    await smtp.send_message(message)
    await smtp.quit()
    print(f"[EMAIL] {purpose} email sent to {to_email}")
