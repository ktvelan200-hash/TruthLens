"""
TruthLens – NLP Preprocessing Service
Cleans and prepares raw news text for ML feature extraction.

Pipeline:
  1. Lowercase
  2. Remove HTML tags
  3. Remove URLs
  4. Remove punctuation & special characters
  5. Tokenize
  6. Remove stop-words
  7. Lemmatize
"""

import re
import string
import logging
from typing import List, Tuple

import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# NLTK resource bootstrap – download only if missing
# ---------------------------------------------------------------------------
_REQUIRED_NLTK = [
    ("tokenizers/punkt",           "punkt"),
    ("tokenizers/punkt_tab",       "punkt_tab"),
    ("corpora/stopwords",          "stopwords"),
    ("corpora/wordnet",            "wordnet"),
    ("corpora/omw-1.4",            "omw-1.4"),
]

def _ensure_nltk_resources() -> None:
    """
    Download required NLTK data if not already present.
    Failures are caught and logged so the module still imports
    even in air-gapped / restricted environments.
    """
    for resource_path, name in _REQUIRED_NLTK:
        try:
            nltk.data.find(resource_path)
        except LookupError:
            logger.info("Downloading NLTK resource: %s", name)
            try:
                nltk.download(name, quiet=True)
            except Exception as exc:
                logger.warning("Failed to download NLTK resource '%s': %s", name, exc)

try:
    _ensure_nltk_resources()
except Exception as exc:
    logger.warning("NLTK bootstrap encountered an error: %s", exc)

# ---------------------------------------------------------------------------
# Singletons – initialised lazily so a missing resource doesn't block import
# ---------------------------------------------------------------------------
try:
    _lemmatizer = WordNetLemmatizer()
    _stop_words: set = set(stopwords.words("english"))
except Exception as exc:
    logger.warning("Could not initialise NLTK singletons: %s. Using empty defaults.", exc)
    _lemmatizer = None  # type: ignore[assignment]
    _stop_words = set()

# Extra domain-specific stop-words that add noise for fake-news detection
_DOMAIN_STOPS = {
    "said", "say", "says", "told", "tell", "also", "would", "could", "one",
    "two", "three", "new", "get", "got", "go", "went", "us", "mr", "mrs",
    "dr", "reuters", "ap", "cnn", "bbc", "foxnews", "breitbart",
}
_stop_words |= _DOMAIN_STOPS

# ---------------------------------------------------------------------------
# Regex patterns (compiled once)
# ---------------------------------------------------------------------------
_RE_HTML     = re.compile(r"<[^>]+>")
_RE_URL      = re.compile(r"https?://\S+|www\.\S+")
_RE_MENTION  = re.compile(r"@\w+")
_RE_HASHTAG  = re.compile(r"#\w+")
_RE_NON_ALPHA = re.compile(r"[^a-z\s]")
_RE_WHITESPACE = re.compile(r"\s+")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def clean_text(text: str) -> str:
    """
    Full cleaning pipeline.
    Returns a clean, lowercased, stop-word-free, lemmatized string.
    """
    if not text or not isinstance(text, str):
        return ""

    # 1. Lowercase
    text = text.lower()

    # 2. Remove HTML
    text = _RE_HTML.sub(" ", text)

    # 3. Remove URLs
    text = _RE_URL.sub(" ", text)

    # 4. Remove @mentions and #hashtags
    text = _RE_MENTION.sub(" ", text)
    text = _RE_HASHTAG.sub(" ", text)

    # 5. Remove numbers and non-alpha characters
    text = _RE_NON_ALPHA.sub(" ", text)

    # 6. Collapse whitespace
    text = _RE_WHITESPACE.sub(" ", text).strip()

    # 7. Tokenize
    try:
        tokens = word_tokenize(text)
    except Exception:
        tokens = text.split()

    # 8. Remove stop-words and short tokens (len < 3)
    tokens = [t for t in tokens if t not in _stop_words and len(t) >= 3]

    # 9. Lemmatize
    if _lemmatizer is not None:
        tokens = [_lemmatizer.lemmatize(t) for t in tokens]

    return " ".join(tokens)


def combine_headline_content(headline: str, content: str) -> str:
    """
    Merge headline and content with the headline given 3× weight
    (repeated three times) so the model treats it as more important.
    """
    h = headline.strip() if headline else ""
    c = content.strip() if content else ""
    # Repeat headline for emphasis
    combined = f"{h} {h} {h} {c}"
    return combined


def preprocess_for_prediction(headline: str, content: str) -> str:
    """
    Full preprocessing pipeline for a single prediction request.
    Returns the clean, combined string ready for TF-IDF transform.
    """
    combined = combine_headline_content(headline, content)
    return clean_text(combined)


def extract_keywords(text: str, top_n: int = 10) -> List[Tuple[str, float]]:
    """
    Very lightweight keyword extraction based on TF within the document.
    Returns a list of (word, normalized_score) tuples sorted by score desc.
    Used for the explainability section in the UI.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return []

    tokens = cleaned.split()
    freq: dict[str, int] = {}
    for t in tokens:
        freq[t] = freq.get(t, 0) + 1

    total = sum(freq.values()) or 1
    scored = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:top_n]
    return [(word, round(count / total, 4)) for word, count in scored]


def get_text_stats(raw_text: str) -> dict:
    """
    Return basic statistics about the raw text for the explainability section.
    """
    words = raw_text.split()
    sentences = re.split(r"[.!?]+", raw_text)
    return {
        "word_count": len(words),
        "sentence_count": len([s for s in sentences if s.strip()]),
        "avg_word_length": round(
            sum(len(w) for w in words) / len(words), 2
        ) if words else 0,
        "has_caps_heavy": sum(1 for c in raw_text if c.isupper()) / max(len(raw_text), 1) > 0.2,
        "exclamation_count": raw_text.count("!"),
        "question_count": raw_text.count("?"),
    }
