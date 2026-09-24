"""
Topic modeling using BERTopic with multilingual sentence embeddings.
Falls back to keyword-frequency clustering for small comment sets.
"""
from typing import List, Dict, Tuple, Optional
from collections import Counter, defaultdict
from app.models.loader import ModelLoader
from app.services.preprocessor import get_tokens

MIN_COMMENTS_FOR_BERTOPIC = 15
TOP_N_TOPICS = 8

# Predefined topic categories for keyword-based classification
TOPIC_KEYWORDS = {
    "Pelayanan": ["pelayanan", "layanan", "service", "staff", "cs", "admin", "respon", "respons", "balas", "jawab"],
    "Harga": ["harga", "mahal", "murah", "worth", "worth it", "terjangkau", "biaya", "tarif", "diskon", "promo"],
    "Kualitas": ["kualitas", "quality", "bagus", "buruk", "jelek", "baik", "produk", "bahan", "material"],
    "Pengiriman": ["pengiriman", "kirim", "sampai", "lama", "cepat", "lambat", "ekspedisi", "kurir", "ongkir"],
    "Kemasan": ["kemasan", "packing", "packaging", "bungkus", "rapi", "aman", "rusak"],
    "Informasi": ["informasi", "info", "detail", "deskripsi", "jelas", "lengkap", "panduan", "tutorial"],
    "Fasilitas": ["fasilitas", "tempat", "lokasi", "parkir", "ruang", "area", "gedung"],
    "Konten": ["konten", "video", "foto", "edit", "kreatif", "ide", "keren", "bagus"],
}

def _keyword_topic_classify(processed_text: str) -> Optional[str]:
    """Classify a comment into a predefined topic using keyword matching."""
    tokens = set(get_tokens(processed_text))
    best_topic = None
    best_score = 0

    for topic, keywords in TOPIC_KEYWORDS.items():
        score = len(tokens.intersection(set(keywords)))
        if score > best_score:
            best_score = score
            best_topic = topic

    return best_topic if best_score > 0 else "Umum"

def extract_topics(processed_texts: List[str]) -> Tuple[List[Optional[str]], List[Dict]]:
    """
    Extract topics from a list of preprocessed comments.
    Returns:
        - per_comment_topics: List of topic label per comment (same length as input)
        - topic_summary: List of { topic, frequency, percentage }
    """
    n = len(processed_texts)
    if n == 0:
        return [], []

    per_comment_topics = []

    sentence_model = ModelLoader.get_sentence_model()
    if sentence_model and n >= MIN_COMMENTS_FOR_BERTOPIC:
        per_comment_topics = _bertopic_classify(processed_texts, sentence_model)
    else:
        # Keyword fallback
        per_comment_topics = [_keyword_topic_classify(t) for t in processed_texts]

    # Aggregate topic statistics
    topic_counts = Counter(per_comment_topics)
    total = sum(topic_counts.values()) or 1

    topic_summary = [
        {
            "topic": topic or "Umum",
            "frequency": count,
            "percentage": round((count / total) * 100, 2),
        }
        for topic, count in topic_counts.most_common(TOP_N_TOPICS)
        if topic
    ]

    return per_comment_topics, topic_summary

def _bertopic_classify(processed_texts: List[str], sentence_model) -> List[Optional[str]]:
    """Use BERTopic for topic modeling, then map clusters to closest named topic."""
    try:
        from bertopic import BERTopic
        from sklearn.feature_extraction.text import CountVectorizer

        # Use keyword-aware vectorizer to help with Indonesian text
        vectorizer = CountVectorizer(ngram_range=(1, 2), stop_words=None, min_df=1)

        topic_model = BERTopic(
            embedding_model=sentence_model,
            vectorizer_model=vectorizer,
            nr_topics=min(TOP_N_TOPICS, max(2, len(processed_texts) // 5)),
            verbose=False,
        )

        topics, _ = topic_model.fit_transform(processed_texts)
        topic_info = topic_model.get_topic_info()

        # Map BERTopic cluster IDs to human-readable labels
        cluster_to_label = {}
        for _, row in topic_info.iterrows():
            topic_id = row["Topic"]
            if topic_id == -1:
                cluster_to_label[topic_id] = "Umum"
                continue
            # Get top words for this cluster
            top_words = [w for w, _ in topic_model.get_topic(topic_id)[:5]]
            label = _match_to_predefined_topic(top_words)
            cluster_to_label[topic_id] = label

        return [cluster_to_label.get(t, "Umum") for t in topics]
    except Exception as e:
        print(f"⚠️  BERTopic failed ({e}), falling back to keyword classification.")
        return [_keyword_topic_classify(t) for t in processed_texts]

def _match_to_predefined_topic(words: List[str]) -> str:
    """Match BERTopic cluster words to closest predefined topic."""
    best_topic = "Umum"
    best_score = 0

    word_set = set(words)
    for topic, keywords in TOPIC_KEYWORDS.items():
        score = len(word_set.intersection(set(keywords)))
        if score > best_score:
            best_score = score
            best_topic = topic

    return best_topic
