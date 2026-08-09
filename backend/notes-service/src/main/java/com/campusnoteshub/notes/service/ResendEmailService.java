package com.campusnoteshub.notes.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Transactional email service using the Resend REST API.
 * Sends "Notes Available" notification emails without SMTP — 
 * uses a simple HTTP POST so Railway health checks are unaffected.
 */
@Service
public class ResendEmailService {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailService.class);
    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    @Value("${resend.api-key:}")
    private String apiKey;

    @Value("${resend.from-email:onboarding@resend.dev}")
    private String fromEmail;

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private final RestTemplate restTemplate;

    public ResendEmailService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Send a "Notes are now available" email to the requester.
     *
     * @param toEmail   the recipient email address
     * @param noteName  the subject/name of the requested note
     * @param noteId    the ID of the uploaded note (used for building the link)
     * @return true if the email was sent successfully, false otherwise
     */
    public boolean sendNoteAvailableEmail(String toEmail, String noteName, String noteId) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Resend API key not configured — skipping email notification to {}", toEmail);
            return false;
        }

        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Recipient email is blank — skipping notification for note '{}'", noteName);
            return false;
        }

        String noteUrl = frontendUrl + "/notes/" + noteId;

        String htmlBody = buildEmailHtml(noteName, noteUrl);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("from", "Campus Notes Hub <" + fromEmail + ">");
            body.put("to", List.of(toEmail));
            body.put("subject", noteName + " Notes are now available!");
            body.put("html", htmlBody);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    RESEND_API_URL, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ Email notification sent to {} for note '{}'", toEmail, noteName);
                return true;
            } else {
                log.error("❌ Resend API returned status {} for email to {}: {}",
                        response.getStatusCode(), toEmail, response.getBody());
                return false;
            }
        } catch (Exception e) {
            log.error("❌ Failed to send email notification to {} for note '{}': {}",
                    toEmail, noteName, e.getMessage());
            return false;
        }
    }

    /**
     * Builds a clean, styled HTML email body.
     */
    private String buildEmailHtml(String noteName, String noteUrl) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                </head>
                <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
                        <tr>
                            <td align="center">
                                <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
                                            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;">📚 Campus Notes Hub</h1>
                                        </td>
                                    </tr>
                                    <!-- Body -->
                                    <tr>
                                        <td style="padding:32px 24px;">
                                            <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;">Good news! 🎉</h2>
                                            <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
                                                The notes you requested — <strong style="color:#6366f1;">%s</strong> — are now available on Campus Notes Hub.
                                            </p>
                                            <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                                                Click the button below to view and download them:
                                            </p>
                                            <!-- CTA Button -->
                                            <table width="100%%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td align="center">
                                                        <a href="%s" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
                                                            View Notes →
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding:20px 24px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
                                            <p style="margin:0;color:#9ca3af;font-size:12px;">
                                                You received this because you requested notes on Campus Notes Hub.<br>
                                                If you didn't make this request, you can safely ignore this email.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(noteName, noteUrl);
    }
}
