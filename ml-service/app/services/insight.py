"""
Insight generator — produces data-driven natural language insights.
Uses templates filled with real analysis stats — no hallucination possible.
"""
from typing import List, Dict, Any, Optional

def generate_insight(
    total: int,
    positive_count: int,
    neutral_count: int,
    negative_count: int,
    keywords: List[Dict],
    topics: List[Dict],
    comment_details: List[Dict],
) -> Dict[str, str]:
    """
    Generate a structured insight object based on analysis results.
    All statements are derived from the actual data.
    """
    if total == 0:
        return {
            "overall": "Tidak ada komentar yang dapat dianalisis.",
            "positive": "",
            "negative": "",
            "topics": "",
            "recommendation": "",
        }

    pos_pct = round((positive_count / total) * 100, 1)
    neu_pct = round((neutral_count  / total) * 100, 1)
    neg_pct = round((negative_count / total) * 100, 1)

    # Determine dominant sentiment
    if positive_count >= neutral_count and positive_count >= negative_count:
        dominant = "positif"
        dominant_pct = pos_pct
    elif neutral_count >= positive_count and neutral_count >= negative_count:
        dominant = "netral"
        dominant_pct = neu_pct
    else:
        dominant = "negatif"
        dominant_pct = neg_pct

    # Overall
    overall = (
        f"Dari total {total:,} komentar yang dianalisis, sentimen {dominant} mendominasi "
        f"dengan {dominant_pct}% komentar. "
        f"Distribusi lengkap: {pos_pct}% positif, {neu_pct}% netral, {neg_pct}% negatif."
    )

    # Positive insight
    top_kw_positive = _get_sentiment_keywords(comment_details, "positive", keywords, 3)
    if positive_count > 0 and top_kw_positive:
        positive = (
            f"Sebanyak {positive_count:,} komentar ({pos_pct}%) bersifat positif. "
            f"Aspek yang paling banyak diapresiasi mencakup: {', '.join(top_kw_positive)}."
        )
    elif positive_count > 0:
        positive = f"Sebanyak {positive_count:,} komentar ({pos_pct}%) bersifat positif."
    else:
        positive = "Tidak ada komentar positif yang terdeteksi."

    # Negative insight
    top_kw_negative = _get_sentiment_keywords(comment_details, "negative", keywords, 3)
    if negative_count > 0 and top_kw_negative:
        negative = (
            f"Sebanyak {negative_count:,} komentar ({neg_pct}%) bersifat negatif. "
            f"Keluhan yang paling sering muncul berkaitan dengan: {', '.join(top_kw_negative)}."
        )
    elif negative_count > 0:
        negative = f"Sebanyak {negative_count:,} komentar ({neg_pct}%) bersifat negatif."
    else:
        negative = "Tidak ada komentar negatif yang terdeteksi pada postingan ini."

    # Topic insight
    top_topics = [t["topic"] for t in topics[:3]] if topics else []
    if top_topics:
        topics_str = ", ".join(top_topics)
        topic_insight = f"Topik yang paling banyak dibicarakan adalah: {topics_str}."
    else:
        topic_insight = "Tidak ada topik dominan yang teridentifikasi."

    # Recommendation
    recommendation = _generate_recommendation(neg_pct, negative_count, top_kw_negative, top_topics)

    return {
        "overall": overall,
        "positive": positive,
        "negative": negative,
        "topics": topic_insight,
        "recommendation": recommendation,
    }

def _get_sentiment_keywords(
    comment_details: List[Dict],
    sentiment: str,
    all_keywords: List[Dict],
    top_n: int,
) -> List[str]:
    """Get keywords most associated with a given sentiment."""
    from collections import Counter
    from app.services.preprocessor import get_tokens

    sentiment_texts = [
        c.get("processed_text", "") or c.get("text", "")
        for c in comment_details
        if c.get("sentiment") == sentiment
    ]

    if not sentiment_texts:
        return []

    token_counter: Counter = Counter()
    for text in sentiment_texts:
        token_counter.update(get_tokens(text))

    return [word for word, _ in token_counter.most_common(top_n)]

def _generate_recommendation(
    neg_pct: float,
    negative_count: int,
    negative_keywords: List[str],
    top_topics: List[str],
) -> str:
    """Generate a recommendation based on negative feedback patterns."""
    if neg_pct == 0:
        return "Pertahankan performa saat ini — tidak ada keluhan signifikan yang terdeteksi."

    if neg_pct > 30:
        severity = "Perhatian diperlukan secara mendesak"
    elif neg_pct > 15:
        severity = "Perlu perhatian lebih lanjut"
    else:
        severity = "Perhatikan beberapa keluhan berikut"

    parts = [f"{severity} ({neg_pct}% komentar negatif)."]

    if negative_keywords:
        parts.append(
            f"Fokuskan perbaikan pada aspek yang berkaitan dengan: {', '.join(negative_keywords)}."
        )

    if "Pengiriman" in top_topics:
        parts.append("Evaluasi kecepatan dan keandalan layanan pengiriman.")
    if "Pelayanan" in top_topics:
        parts.append("Tingkatkan responsivitas dan kualitas layanan pelanggan.")
    if "Harga" in top_topics:
        parts.append("Pertimbangkan transparansi harga atau program promosi.")

    return " ".join(parts)
