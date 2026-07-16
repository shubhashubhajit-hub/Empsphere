import smtplib
import logging
from email.mime.text import MIMEText
from app.config import settings

logger = logging.getLogger("stacks.email")
logging.basicConfig(level=logging.INFO)


def send_email(to_email: str, subject: str, body: str):
    """
    Sends a real email if SMTP_HOST/SMTP_USER/SMTP_PASS are configured.
    Otherwise falls back to printing the email to the backend console —
    this keeps OTP/notification flows fully working in local dev without
    requiring an email account.
    """
    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASS:
        try:
            msg = MIMEText(body)
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM
            msg["To"] = to_email

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
                server.sendmail(settings.SMTP_FROM, [to_email], msg.as_string())
            return True
        except Exception as e:
            logger.warning(f"SMTP send failed ({e}); falling back to console output.")

    logger.info(f"\n--- EMAIL (console fallback, no SMTP configured) ---\nTo: {to_email}\nSubject: {subject}\n{body}\n-----------------------------------------------------\n")
    return False
