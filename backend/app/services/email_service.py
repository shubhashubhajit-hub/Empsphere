import smtplib
import logging
import requests
from email.mime.text import MIMEText
from app.config import settings

logger = logging.getLogger("stacks.email")
logging.basicConfig(level=logging.INFO)


def _send_via_resend(to_email: str, subject: str, body: str) -> bool:
    try:
        resp = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            json={
                "from": settings.RESEND_FROM or "onboarding@resend.dev",
                "to": [to_email],
                "subject": subject,
                "text": body,
            },
            timeout=10,
        )
        if resp.status_code in (200, 201):
            return True
        logger.warning(f"Resend send failed ({resp.status_code}: {resp.text}); falling back.")
        return False
    except Exception as e:
        logger.warning(f"Resend send failed ({e}); falling back.")
        return False


def send_email(to_email: str, subject: str, body: str):
    actual_to = to_email
    actual_subject = subject
    if settings.EMAIL_REDIRECT_TO:
        actual_to = settings.EMAIL_REDIRECT_TO
        actual_subject = f"[for {to_email}] {subject}"

    if settings.RESEND_API_KEY:
        if _send_via_resend(actual_to, actual_subject, body):
            return True

    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASS:
        try:
            msg = MIMEText(body)
            msg["Subject"] = actual_subject
            msg["From"] = settings.SMTP_FROM
            msg["To"] = actual_to

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
                server.sendmail(settings.SMTP_FROM, [actual_to], msg.as_string())
            return True
        except Exception as e:
            logger.warning(f"SMTP send failed ({e}); falling back to console output.")

    logger.info(f"\n--- EMAIL (console fallback, no email provider configured) ---\nTo: {to_email}\nSubject: {subject}\n{body}\n-----------------------------------------------------\n")
    return False