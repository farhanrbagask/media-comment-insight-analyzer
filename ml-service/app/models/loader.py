"""
Model loader — lazy singleton loader for all NLP models.
Loads on startup to avoid cold-start delay on first request.
"""
import sys

# Force UTF-8 output on Windows to avoid UnicodeEncodeError with emoji in cp1252
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from typing import Optional
from transformers import pipeline
from sentence_transformers import SentenceTransformer
import torch


class ModelLoader:
    _sentiment_pipeline = None
    _sentence_model: Optional[SentenceTransformer] = None
    _loaded: bool = False

    @classmethod
    def load_all(cls):
        """Load all models. Called once at app startup."""
        print("[ML] Loading NLP models...")
        cls._load_sentiment()
        cls._load_sentence_model()
        cls._loaded = True
        print("[ML] All models loaded.")

    @classmethod
    def _load_sentiment(cls):
        """
        Load sentiment classification model.
        primary = "./my-indobert-sentiment"
        Fallback: lxyuan/distilbert-base-multilingual-cased-sentiments-student
        """
        primary = "./my-indobert-sentiment"
        fallback = "lxyuan/distilbert-base-multilingual-cased-sentiments-student"

        for model_id in (primary, fallback):
            try:
                print(f"[ML] Loading sentiment model: {model_id}...")
                cls._sentiment_pipeline = pipeline(
                    "text-classification",
                    model=model_id,
                    tokenizer=model_id,
                    device=0 if torch.cuda.is_available() else -1,
                    truncation=True,
                    max_length=512,
                )
                print(f"[ML] Sentiment model loaded OK: {model_id}")
                return
            except Exception as e:
                print(f"[ML] Model '{model_id}' failed: {type(e).__name__}: {str(e)[:120]}")
                if model_id == fallback:
                    raise RuntimeError(
                        "Both primary and fallback sentiment models failed to load. "
                        "Check your internet connection or Hugging Face token."
                    ) from e

    @classmethod
    def _load_sentence_model(cls):
        """Load multilingual sentence embeddings for BERTopic."""
        model_id = "paraphrase-multilingual-MiniLM-L12-v2"
        try:
            print(f"[ML] Loading sentence embedding model: {model_id}...")
            cls._sentence_model = SentenceTransformer(model_id)
            print("[ML] Sentence model loaded OK.")
        except Exception as e:
            print(f"[ML] Sentence model failed to load: {e}")
            cls._sentence_model = None

    @classmethod
    def get_sentiment_pipeline(cls):
        if not cls._sentiment_pipeline:
            cls._load_sentiment()
        return cls._sentiment_pipeline

    @classmethod
    def get_sentence_model(cls) -> Optional[SentenceTransformer]:
        return cls._sentence_model

    @classmethod
    def is_loaded(cls) -> bool:
        return cls._loaded
