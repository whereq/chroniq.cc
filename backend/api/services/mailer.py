"""Transactional email — provider-agnostic SMTP.

Configure SMTP via settings (smtp_host, smtp_port, smtp_username, smtp_password).
While smtp_host is empty the mailer runs in "log only" mode: it renders the
message to the logs and sends nothing, so the rest of the flow works before the
email provider is wired up.

Templates are intentionally simple here; richer HTML can be layered on later.
"""

import logging
import smtplib
from email.message import EmailMessage

from chroniq.config import get_settings

logger = logging.getLogger(__name__)


def send_email(
    *,
    to: str,
    subject: str,
    body: str,
    ics: str | None = None,
    ics_filename: str = "invite.ics",
) -> bool:
    """Send an email. Returns True if sent, False if in log-only mode.

    Raises on hard SMTP failures so callers can decide whether to retry.
    """
    settings = get_settings()

    msg = EmailMessage()
    msg["From"] = settings.email_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    if ics:
        msg.add_attachment(
            ics.encode("utf-8"),
            maintype="text",
            subtype="calendar",
            filename=ics_filename,
        )

    if not settings.smtp_host:
        logger.info(
            "[mailer:log-only] To=%s Subject=%s\n%s%s",
            to,
            subject,
            body,
            "\n[+ .ics attachment]" if ics else "",
        )
        return False

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(msg)

    logger.info("Email sent to %s (%s)", to, subject)
    return True
