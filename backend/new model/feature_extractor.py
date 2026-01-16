# feature_extractor.py

import re
import pandas as pd
from urllib.parse import urlparse

# -------------------------
# Helper functions
# -------------------------

def count_char(url, char):
    return url.count(char)

def has_ip(hostname):
    return int(bool(re.search(r'\b\d{1,3}(\.\d{1,3}){3}\b', hostname)))

def ratio_digits(text):
    if len(text) == 0:
        return 0
    return sum(c.isdigit() for c in text) / len(text)

def count_repeated_chars(url):
    return sum(1 for i in range(len(url)-1) if url[i] == url[i+1])

def suspicious_keywords(url):
    keywords = [
        'login', 'secure', 'verify', 'update',
        'account', 'bank', 'free', 'signin'
    ]
    return sum(1 for k in keywords if k in url.lower())

def shortening_service(url):
    services = ['bit.ly', 'tinyurl', 'goo.gl', 't.co']
    return int(any(s in url for s in services))

# -------------------------
# Main feature extraction
# -------------------------

def extract_features(url):
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    path = parsed.path or ""

    features = {
        'length_url': len(url),
        'length_hostname': len(hostname),
        'ip': has_ip(hostname),
        'nb_dots': count_char(url, '.'),
        'nb_hyphens': count_char(url, '-'),
        'nb_at': count_char(url, '@'),
        'nb_qm': count_char(url, '?'),
        'nb_and': count_char(url, '&'),
        'nb_eq': count_char(url, '='),
        'nb_underscore': count_char(url, '_'),
        'nb_slash': count_char(url, '/'),
        'nb_percent': count_char(url, '%'),
        'nb_colon': count_char(url, ':'),
        'nb_www': int('www' in url.lower()),
        'nb_com': int('.com' in url.lower()),
        'nb_dslash': count_char(url, '//'),
        'https_token': int('https' in url.lower()),
        'ratio_digits_url': ratio_digits(url),
        'ratio_digits_host': ratio_digits(hostname),
        'punycode': int('xn--' in hostname),
        'port': int(parsed.port is not None),
        'tld_in_path': int(any(tld in path for tld in ['.com', '.net', '.org'])),
        'tld_in_subdomain': int(hostname.count('.') > 2),
        'abnormal_subdomain': int(hostname.startswith('http')),
        'nb_subdomains': hostname.count('.'),
        'prefix_suffix': int('-' in hostname),
        'random_domain': int(len(hostname) > 25),
        'shortening_service': shortening_service(url),
        'path_extension': int(bool(re.search(r'\.\w+$', path))),
        'char_repeat': count_repeated_chars(url),
        'phish_hints': suspicious_keywords(url)
    }

    return pd.DataFrame([features])
