import re
import math
import pandas as pd
from urllib.parse import urlparse

try:
    import tldextract
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'tldextract', '-q'])
    import tldextract

# ── Must match EXACTLY the order used during training ─────────────
FEATURE_COLS = [
    'length_url', 'length_hostname', 'ip', 'nb_dots', 'nb_hyphens', 
    'nb_at', 'nb_qm', 'nb_and', 'nb_eq', 'nb_underscore', 'nb_slash', 
    'nb_percent', 'nb_colon', 'nb_www', 'nb_com', 'nb_dslash', 
    'https_token', 'ratio_digits_url', 'ratio_digits_host', 'punycode', 
    'port', 'tld_in_path', 'tld_in_subdomain', 'abnormal_subdomain', 
    'nb_subdomains', 'prefix_suffix', 'random_domain', 'shortening_service', 
    'path_extension', 'char_repeat', 'phish_hints'
]

SHORTENING_SERVICES = {
    'bit.ly', 'goo.gl', 'tinyurl.com', 't.co', 'ow.ly', 'is.gd',
    'buff.ly', 'adf.ly', 'bit.do', 'mcaf.ee', 'su.pr', 'ift.tt',
    'dlvr.it', 'shorte.st', 'cutt.ly', 'rb.gy', 'shorturl.at',
    'tiny.cc', 'lnkd.in', 'bl.ink', 'hyperurl.co', 'v.gd'
}

COMMON_TLDS = {
    'com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'info',
    'biz', 'me', 'us', 'uk', 'de', 'fr', 'ru', 'cn', 'jp',
    'in', 'br', 'au', 'ca', 'it', 'es', 'nl', 'se', 'no'
}

SUSPICIOUS_EXTS = {
    '.exe', '.zip', '.rar', '.dmg', '.pkg', '.bat', '.sh',
    '.php', '.asp', '.aspx', '.cgi', '.pl', '.py', '.jar'
}

def _entropy(s):
    if not s:
        return 0.0
    prob = [float(s.count(c)) / len(s) for c in set(s)]
    return -sum(p * math.log2(p) for p in prob)


def extract_features(url: str) -> pd.DataFrame:
    """
    Extract the 14 features used during training.
    Returns a single-row DataFrame with columns in correct order.
    """
    # Ensure scheme exists
    if not url.startswith(('http://', 'https://', 'ftp://')):
        url_parsed = 'http://' + url
    else:
        url_parsed = url

    parsed    = urlparse(url_parsed)
    extracted = tldextract.extract(url_parsed)

    hostname  = (parsed.netloc or '').lower().split(':')[0]
    path      = (parsed.path or '').lower()
    domain    = extracted.domain.lower()
    subdomain = extracted.subdomain.lower()
    tld       = extracted.suffix.lower()
    full_url  = url.lower()

    # 1. length_url
    length_url = len(url)

    # 2. ip — IPv4 in hostname
    ipv4 = re.compile(r'^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$')
    ip = 1 if ipv4.match(hostname) else 0

    # 3. ratio_digits_url
    ratio_digits_url = sum(c.isdigit() for c in full_url) / len(full_url) if full_url else 0

    # 4. ratio_digits_host
    ratio_digits_host = sum(c.isdigit() for c in hostname) / len(hostname) if hostname else 0

    # 5. punycode
    punycode = 1 if 'xn--' in full_url else 0

    # 6. port — non-standard port present
    standard_ports = {80, 443, 21, 22, 25, 110, 143}
    port = 1 if (parsed.port is not None and parsed.port not in standard_ports) else 0

    # 7. tld_in_path — a known TLD word appears as path segment
    path_parts = path.strip('/').split('/')
    tld_in_path = 1 if any(p in COMMON_TLDS for p in path_parts) else 0

    # 8. tld_in_subdomain — TLD word appears in subdomain parts
    sub_parts = subdomain.split('.')
    tld_in_subdomain = 1 if any(p in COMMON_TLDS for p in sub_parts) else 0

    # 9. abnormal_subdomain
    abnormal_subdomain = 0
    if subdomain:
        if re.match(r'^\d', subdomain):       abnormal_subdomain = 1
        if len(subdomain) > 20:               abnormal_subdomain = 1
        if subdomain.count('.') > 2:          abnormal_subdomain = 1
        if re.search(r'\d{5,}', subdomain):   abnormal_subdomain = 1

    # 10. nb_subdomains
    nb_subdomains = len([s for s in subdomain.split('.') if s]) if subdomain else 0

    # 11. prefix_suffix — hyphen in domain name
    prefix_suffix = 1 if '-' in domain else 0

    # 12. random_domain — high entropy suggests randomly generated domain
    random_domain = 1 if _entropy(domain) > 3.5 else 0

    # 13. shortening_service
    netloc_clean = hostname.replace('www.', '')
    shortening_service = 1 if netloc_clean in SHORTENING_SERVICES else 0

    # 14. path_extension — suspicious file extension in path
    path_extension = 1 if any(path.endswith(ext) for ext in SUSPICIOUS_EXTS) else 0

    # Missing numerical counts and flags
    length_hostname = len(hostname)
    nb_dots = full_url.count('.')
    nb_hyphens = full_url.count('-')
    nb_at = full_url.count('@')
    nb_qm = full_url.count('?')
    nb_and = full_url.count('&')
    nb_eq = full_url.count('=')
    nb_underscore = full_url.count('_')
    nb_slash = full_url.count('/')
    nb_percent = full_url.count('%')
    nb_colon = full_url.count(':')
    nb_www = 1 if 'www' in full_url else 0
    nb_com = 1 if 'com' in full_url else 0
    nb_dslash = full_url.count('//')
    https_token = 1 if 'https' in hostname else 0
    char_repeat = 0 # default stub
    phish_hints = sum(1 for w in ['login', 'verify', 'update', 'secure', 'account', 'bank', 'signin'] if w in full_url)

    # ── Build dict in exact training order ───────────────────────
    features = {
        'length_url'        : length_url,
        'length_hostname'   : length_hostname,
        'ip'                : ip,
        'nb_dots'           : nb_dots,
        'nb_hyphens'        : nb_hyphens,
        'nb_at'             : nb_at,
        'nb_qm'             : nb_qm,
        'nb_and'            : nb_and,
        'nb_eq'             : nb_eq,
        'nb_underscore'     : nb_underscore,
        'nb_slash'          : nb_slash,
        'nb_percent'        : nb_percent,
        'nb_colon'          : nb_colon,
        'nb_www'            : nb_www,
        'nb_com'            : nb_com,
        'nb_dslash'         : nb_dslash,
        'https_token'       : https_token,
        'ratio_digits_url'  : ratio_digits_url,
        'ratio_digits_host' : ratio_digits_host,
        'punycode'          : punycode,
        'port'              : port,
        'tld_in_path'       : tld_in_path,
        'tld_in_subdomain'  : tld_in_subdomain,
        'abnormal_subdomain': abnormal_subdomain,
        'nb_subdomains'     : nb_subdomains,
        'prefix_suffix'     : prefix_suffix,
        'random_domain'     : random_domain,
        'shortening_service': shortening_service,
        'path_extension'    : path_extension,
        'char_repeat'       : char_repeat,
        'phish_hints'       : phish_hints
    }

    return pd.DataFrame([features])[FEATURE_COLS]  # enforce column order

