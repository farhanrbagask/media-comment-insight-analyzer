"""
Keyword extraction using TF-IDF + n-gram analysis.
"""
from typing import List, Dict
from collections import Counter
import re

from app.services.preprocessor import get_tokens, STOPWORDS

def extract_keywords(processed_texts: List[str], top_n: int = 20) -> List[Dict]:
    """
    Extract top keywords using term frequency + bigram analysis.
    Returns list of { keyword, frequency, percentage }.
    """
    if not processed_texts:
        return []

    # Unigram frequency
    all_unigrams = []
    all_bigrams = []

    for text in processed_texts:
        tokens = get_tokens(text)
        all_unigrams.extend(tokens)

        # Bigrams
        for j in range(len(tokens) - 1):
            bigram = f"{tokens[j]} {tokens[j+1]}"
            all_bigrams.append(bigram)

    # Count frequencies
    unigram_counts = Counter(all_unigrams)
    bigram_counts = Counter(all_bigrams)

    # Filter bigrams that appear at least twice
    meaningful_bigrams = {k: v for k, v in bigram_counts.items() if v >= 2}

    # Merge: prefer bigrams over constituent unigrams if bigram is common
    keywords: Dict[str, int] = {}

    for bigram, count in meaningful_bigrams.items():
        keywords[bigram] = count
        # Remove constituent words if bigram is more frequent
        parts = bigram.split()
        for part in parts:
            if part in unigram_counts and unigram_counts[part] <= count * 1.5:
                unigram_counts.pop(part, None)

    for word, count in unigram_counts.items():
        if count >= 2:  # only include words that appear more than once
            keywords[word] = count

    # Sort and take top N
    sorted_kw = sorted(keywords.items(), key=lambda x: x[1], reverse=True)[:top_n]
    total_mentions = sum(v for _, v in sorted_kw) or 1

    return [
        {
            "keyword": kw,
            "frequency": freq,
            "percentage": round((freq / total_mentions) * 100, 2),
        }
        for kw, freq in sorted_kw
    ]
