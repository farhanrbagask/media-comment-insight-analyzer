"""
Sentiment analysis service using IndoBERT.
"""
from typing import List, Dict
from app.models.loader import ModelLoader

# Label mapping from model output to our standard labels
LABEL_MAP = {
    "LABEL_0": "negative",
    "LABEL_1": "neutral",
    "LABEL_2": "positive",
    # lxyuan model labels
    "negative": "negative",
    "neutral": "neutral",
    "positive": "positive",
    # Some models use these
    "NEGATIVE": "negative",
    "NEUTRAL": "neutral",
    "POSITIVE": "positive",
}

def analyze_sentiment(processed_texts: List[str]) -> List[Dict]:
    """
    Classify sentiment for a list of preprocessed comments.
    Returns list of { sentiment, score } dicts.
    """
    pipe = ModelLoader.get_sentiment_pipeline()
    results = []

    # Process in batches of 32 to avoid OOM
    BATCH_SIZE = 32
    for i in range(0, len(processed_texts), BATCH_SIZE):
        batch = processed_texts[i:i + BATCH_SIZE]

        # Handle empty texts
        safe_batch = [t if t.strip() else "tidak ada komentar" for t in batch]

        try:
            preds = pipe(safe_batch, truncation=True, max_length=512)
        except Exception:
            # Fallback: mark as neutral if model fails
            preds = [{"label": "neutral", "score": 0.5}] * len(safe_batch)

        for pred in preds:
            label = LABEL_MAP.get(pred["label"], "neutral")
            results.append({
                "sentiment": label,
                "score": round(pred["score"], 4),
            })

    return results
