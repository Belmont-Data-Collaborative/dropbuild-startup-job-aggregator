"""Send the weekly digest email via SMTP (Gmail TLS)."""
import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

_FROM = 'databelmont@gmail.com'
_TO = ['pranish.bhagat@belmont.edu', 'bhagatpranish@gmail.com']


def send_digest(html_body: str, plain_body: str, subject: str) -> bool:
    """
    Send the digest email.  Returns True on success, False on failure.

    Required env vars (loaded from scraper/.env via dotenv before this is called):
      SMTP_HOST   — default smtp.gmail.com
      SMTP_PORT   — default 587
      SMTP_USER   — Gmail address used to authenticate
      SMTP_PASS   — Gmail App Password (16-char, spaces OK)
    """
    host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    port = int(os.getenv('SMTP_PORT', '587'))
    user = os.getenv('SMTP_USER', '')
    password = os.getenv('SMTP_PASS', '')

    if not user or not password:
        logger.warning('Email skipped: SMTP_USER or SMTP_PASS not set in .env')
        return False

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f'Startup Jobs <{_FROM}>'
    msg['To'] = ', '.join(_TO)

    msg.attach(MIMEText(plain_body, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    try:
        with smtplib.SMTP(host, port) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(user, password)
            smtp.sendmail(_FROM, _TO, msg.as_string())
        logger.info('Digest email sent to %s', _TO)
        return True
    except Exception as exc:
        logger.error('Failed to send digest email: %s', exc)
        return False
