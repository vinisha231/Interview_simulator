"""Security response headers (defense-in-depth for XSS/clickjacking).

React escapes output by default and the app has no HTML-injection sinks, so
these headers are belt-and-braces: a Content-Security-Policy that blocks
injected/inline scripts, plus the standard hardening headers.

The CSP is tuned for this app:
- script-src 'self'      -> only our bundled JS (no inline/eval), the key XSS lever
- style-src adds Google Fonts CSS + 'unsafe-inline' (React inline styles)
- font-src  adds fonts.gstatic.com
- connect-src 'self'     -> the SPA calls /api on its own origin (Amplify proxy)
- media-src allows blob:/data: for Polly audio playback
- frame-ancestors 'none' -> clickjacking protection
"""
import os

_CSP = (
    "default-src 'self'; "
    "base-uri 'self'; "
    "object-src 'none'; "
    "frame-ancestors 'none'; "
    "form-action 'self'; "
    "img-src 'self' data:; "
    "script-src 'self'; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' https://fonts.gstatic.com; "
    "connect-src 'self'; "
    "media-src 'self' data: blob:"
)

# The app records interview answers by voice, so microphone must stay allowed.
_PERMISSIONS_POLICY = "camera=(), geolocation=(), microphone=(self)"


def security_headers() -> dict:
    """Return the security headers to attach to every response."""
    # Report-only lets you roll out CSP without risk of breaking the page.
    csp_header = (
        "Content-Security-Policy-Report-Only"
        if os.getenv("CSP_REPORT_ONLY", "").strip().lower() in ("1", "true", "yes")
        else "Content-Security-Policy"
    )
    return {
        csp_header: _CSP,
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": _PERMISSIONS_POLICY,
        "Cross-Origin-Opener-Policy": "same-origin",
        # Ignored over plain HTTP; honoured once served via HTTPS (CloudFront).
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    }


def add_security_headers(app) -> None:
    """Attach a middleware that sets security headers on every response."""
    headers = security_headers()

    @app.middleware("http")
    async def _set_security_headers(request, call_next):
        response = await call_next(request)
        for key, value in headers.items():
            response.headers.setdefault(key, value)
        return response
