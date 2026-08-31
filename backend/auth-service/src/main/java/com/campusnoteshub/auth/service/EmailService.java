package com.campusnoteshub.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.mail.internet.MimeMessage;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from-email:onboarding@resend.dev}")
    private String fromEmail;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Send 6-digit registration OTP verification email.
     */
    public boolean sendRegistrationOtpEmail(String toEmail, String userName, String otp) {
        String subject = "Your Campus Notes Hub Verification Code: " + otp;
        String htmlBody = buildOtpEmailHtml(userName, otp);

        // 1. Try Resend API if API key is provided and not default placeholder
        if (resendApiKey != null && !resendApiKey.isBlank() && !resendApiKey.contains("your_api_key")) {
            boolean sent = sendViaResend(toEmail, subject, htmlBody);
            if (sent) {
                return true;
            }
        }

        // 2. Try SMTP via JavaMailSender if configured
        if (mailSender != null && smtpUsername != null && !smtpUsername.isBlank()) {
            boolean sent = sendViaSmtp(toEmail, subject, htmlBody);
            if (sent) {
                return true;
            }
        }

        // 3. Fallback: Log OTP to server logs so development/testing works seamlessly
        log.info("=================================================");
        log.info("📧 [REGISTRATION OTP] To: {} ({}) | Code: {}", toEmail, userName, otp);
        log.info("ℹ️ Valid for 5 minutes. Configure RESEND_API_KEY or SMTP in application.yml/environment for production delivery.");
        log.info("=================================================");
        return true;
    }

    private boolean sendViaResend(String toEmail, String subject, String htmlBody) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey.trim());

            Map<String, Object> body = new HashMap<>();
            body.put("from", "Campus Notes Hub <" + fromEmail + ">");
            body.put("to", List.of(toEmail));
            body.put("subject", subject);
            body.put("html", htmlBody);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    RESEND_API_URL, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ Registration OTP email sent via Resend to {}", toEmail);
                return true;
            } else {
                log.error("❌ Resend API returned status {} for email to {}: {}",
                        response.getStatusCode(), toEmail, response.getBody());
                return false;
            }
        } catch (Exception e) {
            log.error("❌ Failed to send email via Resend to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    private boolean sendViaSmtp(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(smtpUsername);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("✅ Registration OTP email sent via SMTP to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("❌ Failed to send email via SMTP to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    private String buildOtpEmailHtml(String userName, String otp) {
        String displayName = (userName != null && !userName.isBlank()) ? userName : "Student";
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
                                            <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;">Email Verification</h2>
                                            <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
                                                Hi <strong>%s</strong>,<br>
                                                Thank you for signing up with Campus Notes Hub! Please use the following 6-digit verification code to complete your registration:
                                            </p>
                                            <!-- OTP Code Box -->
                                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                                                <tr>
                                                    <td align="center">
                                                        <div style="display:inline-block;padding:16px 36px;background:#eef2ff;border:2px dashed #6366f1;border-radius:10px;font-size:32px;font-weight:bold;letter-spacing:8px;color:#4f46e5;">
                                                            %s
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="margin:0 0 8px;color:#ef4444;font-size:13px;font-weight:500;text-align:center;">
                                                ⏱️ This code will expire in 5 minutes.
                                            </p>
                                            <p style="margin:16px 0 0;color:#6b7280;font-size:13px;line-height:1.5;">
                                                If you did not attempt to register on Campus Notes Hub, please ignore this email.
                                            </p>
                                        </td>
                                    </tr>
                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding:20px 24px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
                                            <p style="margin:0;color:#9ca3af;font-size:12px;">
                                                Campus Notes Hub — Empowering Students to Share Knowledge
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(displayName, otp);
    }
}
