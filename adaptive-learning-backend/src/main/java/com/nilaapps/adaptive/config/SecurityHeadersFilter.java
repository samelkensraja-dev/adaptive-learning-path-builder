package com.nilaapps.adaptive.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import java.io.IOException;

// CHANGED: F-04, F-08, B-06 — injects OWASP-recommended security headers on every response
@Component
public class SecurityHeadersFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletResponse response = (HttpServletResponse) res;

        // Prevent embedding in iframes (Clickjacking — F-04)
        response.setHeader("X-Frame-Options", "DENY");

        // Prevent MIME-type sniffing
        response.setHeader("X-Content-Type-Options", "nosniff");

        // Force HTTPS in production (safe to set in dev too)
        response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

        // Restrict information in Referer header
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // Basic CSP — tightened for API responses (F-08)
        response.setHeader("Content-Security-Policy", "default-src 'none'");

        // Disable legacy XSS auditor (conflicts with CSP)
        response.setHeader("X-XSS-Protection", "0");

        // Restrict browser features
        response.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

        chain.doFilter(req, res);
    }
}
