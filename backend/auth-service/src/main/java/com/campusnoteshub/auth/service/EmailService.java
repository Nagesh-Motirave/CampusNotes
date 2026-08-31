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
     * Send 6-digit registration OTP verification email with both HTML and plain text bodies.
     */
    public boolean sendRegistrationOtpEmail(String toEmail, String userName, String otp) {
        if (otp == null || otp.isBlank()) {
            log.error("❌ Cannot send registration email: OTP is null or blank");
            return false;
        }

        String subject = "Your Campus Notes Hub Verification Code: " + otp;
        String htmlBody = buildOtpEmailHtml(userName, otp);
        String textBody = buildOtpEmailText(userName, otp);

        // 1. Try Resend API if API key is provided and not default placeholder
        if (resendApiKey != null && !resendApiKey.isBlank() && !resendApiKey.contains("your_api_key")) {
            boolean sent = sendViaResend(toEmail, subject, htmlBody, textBody);
            if (sent) {
                return true;
            }
        }

        // 2. Try SMTP via JavaMailSender if configured
        if (mailSender != null && smtpUsername != null && !smtpUsername.isBlank()) {
            boolean sent = sendViaSmtp(toEmail, subject, htmlBody, textBody);
            if (sent) {
                return true;
            }
        }

        // 3. Fallback / Dev Log: Log OTP clearly in server logs
        log.info("=================================================");
        log.info("📧 [REGISTRATION OTP] To: {} ({}) | Code: {}", toEmail, userName, otp);
        log.info("ℹ️ Valid for 5 minutes. Configure RESEND_API_KEY or SMTP in application.yml/environment for live delivery.");
        log.info("=================================================");
        return true;
    }

    private boolean sendViaResend(String toEmail, String subject, String htmlBody, String textBody) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey.trim());

            Map<String, Object> body = new HashMap<>();
            body.put("from", "Campus Notes Hub <" + fromEmail + ">");
            body.put("to", List.of(toEmail));
            body.put("subject", subject);
            body.put("html", htmlBody);
            body.put("text", textBody);

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

    private boolean sendViaSmtp(String toEmail, String subject, String htmlBody, String textBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(smtpUsername);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            // helper.setText(plainText, htmlText) sets up multipart/alternative
            helper.setText(textBody, htmlBody);

            mailSender.send(message);
            log.info("✅ Registration OTP email sent via SMTP to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("❌ Failed to send email via SMTP to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    private String buildOtpEmailText(String userName, String otp) {
        String displayName = (userName != null && !userName.isBlank()) ? userName : "Student";
        return """
                Hello %s,

                Thank you for registering with Campus Notes Hub!

                Your 6-digit verification code is: %s

                This code is valid for 5 minutes.

                If you did not request this code, you can safely ignore this email.

                — Campus Notes Hub
                """.formatted(displayName, otp);
    }

    private String buildOtpEmailHtml(String userName, String otp) {
        String displayName = (userName != null && !userName.isBlank()) ? userName : "Student";
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Campus Notes Hub Verification Code</title>
                </head>
                <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
                    <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;padding:40px 0;">
                        <tr>
                            <td align="center">
                                <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);border:1px solid #e5e7eb;">
                                    <!-- Header -->
                                    <tr>
                                        <td align="center" style="background-color:#6366f1;background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
                                            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:0.5px;">📚 Campus Notes Hub</h1>
                                        </td>
                                    </tr>
                                    <!-- Body -->
                                    <tr>
                                        <td style="padding:32px 24px;background-color:#ffffff;">
                                            <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;font-weight:600;">Email Verification</h2>
                                            <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
                                                Hi <strong>%s</strong>,<br>
                                                Thank you for signing up with Campus Notes Hub! Please use the 6-digit verification code below to complete your registration:
                                            </p>

                                            <!-- Prominent OTP Box -->
                                            <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
                                                <tr>
                                                    <td align="center">
                                                        <table cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2ff;border:2px dashed #6366f1;border-radius:10px;">
                                                            <tr>
                                                                <td align="center" style="padding:16px 36px;font-family:'Courier New',Courier,monospace,Arial,sans-serif;font-size:34px;font-weight:bold;letter-spacing:8px;color:#4338ca;">
                                                                    %s
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.5;text-align:center;">
                                                Your code: <strong style="font-family:monospace;font-size:18px;color:#4338ca;letter-spacing:2px;">%s</strong>
                                            </p>

                                            <p style="margin:0 0 8px;color:#dc2626;font-size:13px;font-weight:500;text-align:center;">
                                                ⏱️ This code will expire in 5 minutes.
                                            </p>
                                            <p style="margin:20px 0 0;color:#6b7280;font-size:13px;line-height:1.5;border-top:1px solid #f3f4f6;padding-top:16px;">
                                                If you did not attempt to register on Campus Notes Hub, you can safely ignore this email.
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
                """.formatted(displayName, otp, otp);
    }
}
