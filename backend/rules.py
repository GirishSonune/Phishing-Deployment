import re
import socket
import ssl
import requests
import dns.resolver
import whois
import tldextract

from datetime import datetime, timezone
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from cryptography import x509
from cryptography.hazmat.backends import default_backend


TIMEOUT = 5

session = requests.Session()
session.headers.update({"User-Agent": "Mozilla/5.0"})

DNS_IMPORTANCE = {
    "A": 3,
    "NS": 3,
    "SOA": 3,
    "MX": 2,
    "CAA": 1,
    "TXT": 1
}

SHORTENERS = [
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly"
]

BRANDS = [
    "paypal", "amazon", "google", "facebook", "apple",
    "netflix", "microsoft", "github", "bank", "login"
]


def clean_url(url):
    if not url.startswith(("http://", "https://")):
        return "http://" + url
    return url


def get_domain(url):
    ext = tldextract.extract(url)
    return f"{ext.domain}.{ext.suffix}"


def get_hostname(url):
    return urlparse(url).netloc


# ---------------------------
# DNS FEATURES
# ---------------------------

def dns_score(domain):
    resolver = dns.resolver.Resolver()
    found = 0
    max_possible = sum(DNS_IMPORTANCE.values())

    for record, weight in DNS_IMPORTANCE.items():
        try:
            resolver.resolve(domain, record)
            found += weight
        except:
            pass

    return found / max_possible


# ---------------------------
# SSL FEATURES
# ---------------------------

def ssl_features(url):

    hostname = get_hostname(url)

    data = {
        "ssl_valid": 0,
        "ssl_age_days": -1
    }

    context = ssl.create_default_context()

    try:
        with socket.create_connection((hostname, 443), timeout=TIMEOUT) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:

                cert_bin = ssock.getpeercert(binary_form=True)
                cert = x509.load_der_x509_certificate(cert_bin, default_backend())

                not_before = cert.not_valid_before_utc
                not_after = cert.not_valid_after_utc

                now = datetime.now(timezone.utc)

                data["ssl_valid"] = int(not_before <= now <= not_after)
                data["ssl_age_days"] = (now - not_before).days

    except:
        pass

    return data


# ---------------------------
# DOMAIN FEATURES
# ---------------------------

def domain_features(domain):

    data = {
        "domain_age_days": -1,
        "reg_length_days": -1
    }

    try:
        w = whois.whois(domain)

        created = w.creation_date
        expires = w.expiration_date

        if isinstance(created, list):
            created = created[0]

        if isinstance(expires, list):
            expires = expires[0]

        if created:
            now = datetime.now(timezone.utc)
            data["domain_age_days"] = (now - created).days

        if expires:
            data["reg_length_days"] = (expires - created).days

    except:
        pass

    return data


# ---------------------------
# CONTENT FEATURES
# ---------------------------

def fetch_page(url):

    try:
        r = session.get(url, timeout=8, verify=False)
        soup = BeautifulSoup(r.text, "lxml")
        return r, soup

    except:
        return None, None


def request_url_feature(url, soup):

    if soup is None:
        return -1

    base_domain = get_domain(url)

    tags = {
        "img": "src",
        "script": "src",
        "link": "href",
        "iframe": "src"
    }

    total = 0
    external = 0

    for tag, attr in tags.items():

        for element in soup.find_all(tag):

            link = element.get(attr)

            if link:

                total += 1
                full = urljoin(url, link)

                ext = tldextract.extract(full)
                domain = f"{ext.domain}.{ext.suffix}"

                if domain != base_domain:
                    external += 1

    if total == 0:
        return 0

    ratio = external / total

    if ratio < 0.22:
        return 1
    elif ratio < 0.61:
        return 0
    else:
        return -1


def anchor_ratio_feature(url, soup):

    if soup is None:
        return -1

    base = get_domain(url)

    anchors = soup.find_all("a")

    total = 0
    external = 0

    for a in anchors:

        href = a.get("href")

        if not href:
            continue

        total += 1

        full = urljoin(url, href)

        ext = tldextract.extract(full)
        domain = f"{ext.domain}.{ext.suffix}"

        if domain != base:
            external += 1

    if total == 0:
        return 0

    ratio = external / total

    if ratio < 0.31:
        return 1
    elif ratio < 0.67:
        return 0
    else:
        return -1


# ---------------------------
# RULE ENGINE
# ---------------------------

def rule_engine(url):

    url = clean_url(url)
    domain = get_domain(url)

    score = 0

    # IP address URL
    if re.match(r"http[s]?://\d+\.\d+\.\d+\.\d+", url):
        score += 3

    # Punycode
    if "xn--" in domain:
        score += 3

    # Shorteners
    if domain in SHORTENERS:
        score += 2

    ext = tldextract.extract(url)

    for brand in BRANDS:
        if brand in ext.subdomain and brand not in ext.domain:
            score += 3

    # DNS
    dns = dns_score(domain)
    if dns < 0.5:
        score += 1

    # SSL
    ssl_f = ssl_features(url)
    if ssl_f["ssl_valid"] == 0:
        score += 2

    # Domain age
    dom = domain_features(domain)
    if dom["domain_age_days"] != -1 and dom["domain_age_days"] < 180:
        score += 2

    # Content
    response, soup = fetch_page(url)

    req = request_url_feature(url, soup)
    anc = anchor_ratio_feature(url, soup)

    if req == -1:
        score += 1

    if anc == -1:
        score += 1

    return score