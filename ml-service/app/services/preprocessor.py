"""
Preprocessor — cleans and normalizes raw Indonesian social media comments.
"""
import re
import unicodedata
from typing import List

# Basic Indonesian stopwords (extended Sastrawi list inline for portability)
STOPWORDS = {
    "yang", "dan", "di", "ke", "dari", "ini", "itu", "dengan", "untuk",
    "adalah", "ada", "juga", "sudah", "saya", "aku", "kamu", "dia",
    "mereka", "kita", "kami", "tidak", "bisa", "akan", "ya", "ga", "gak",
    "nya", "si", "pun", "lah", "kah", "tapi", "atau", "jika", "kalau",
    "saat", "ketika", "karena", "sebab", "maka", "oleh", "dalam", "lagi",
    "sudah", "telah", "belum", "baru", "masih", "hanya", "saja", "aja",
    "dong", "deh", "sih", "nih", "lho", "kok", "yuk", "yah", "wah",
    "oh", "ah", "eh", "hm", "hmm", "hehe", "haha", "huhu", "wkwk",
    "wkwkwk", "kwkwk", "xixi", "xoxo", "hahaha", "hehe",
}

def _remove_urls(text: str) -> str:
    return re.sub(r'https?://\S+|www\.\S+', '', text)

def _remove_mentions(text: str) -> str:
    return re.sub(r'@\w+', '', text)

def _normalize_hashtags(text: str) -> str:
    """Keep hashtag content but remove the # symbol."""
    return re.sub(r'#(\w+)', r'\1', text)

def _normalize_whitespace(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()

def _normalize_repeated_chars(text: str) -> str:
    """Normalize repeated characters: 'bagussss' → 'bagus'."""
    return re.sub(r'(.)\1{2,}', r'\1\1', text)

def _handle_emoji(text: str) -> str:
    """Remove emoji characters (keep text sentiment words instead)."""
    return ''.join(c for c in text if not unicodedata.category(c).startswith('So'))

def _normalize_case(text: str) -> str:
    return text.lower()

def preprocess(raw_text: str) -> str:
    """Full preprocessing pipeline for a single comment."""
    if not raw_text or not raw_text.strip():
        return ""
    text = raw_text
    text = _remove_urls(text)
    text = _remove_mentions(text)
    text = _normalize_hashtags(text)
    text = _handle_emoji(text)
    text = _normalize_repeated_chars(text)
    text = _normalize_case(text)
    text = _normalize_whitespace(text)
    return text

def preprocess_batch(raw_texts: List[str]) -> List[str]:
    """Preprocess a list of comments."""
    return [preprocess(t) for t in raw_texts]

def get_tokens(processed_text: str) -> List[str]:
    """Tokenize and remove stopwords for keyword extraction."""
    if not processed_text:
        return []
    words = re.findall(r'\b[a-z]{3,}\b', processed_text)
    return [w for w in words if w not in STOPWORDS]
