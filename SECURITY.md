# Segurança / Security

Não publique senhas, tokens ou dados pessoais em issues. Para relatar uma vulnerabilidade, use o canal privado de advisories de segurança do repositório quando disponível. Inclua passos mínimos de reprodução e versões afetadas; evite dados reais.

Do not post passwords, tokens, or personal data in issues. Report vulnerabilities through this repository's private security advisory channel when available. Include minimal reproduction steps and affected versions; use synthetic data.

Use HTTPS and `SESSION_COOKIE_SECURE=true` outside local development. This release has no built-in login rate limiter: configure request limits at the reverse proxy before exposing it publicly. Sessions are process-local and expire after 30 minutes of inactivity. Public registration always creates CUSTOMER accounts.
