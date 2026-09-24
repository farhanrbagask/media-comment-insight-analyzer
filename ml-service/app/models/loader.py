"""
Model loader — lazy singleton loader for all NLP models.
Loads on startup to avoid cold-start delay on first request.
"""
from typing import Optional
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer
import torch

class ModelLoader:
    _sentiment_pipeline = None
    _sentence_model: Optional[SentenceTransformer] = None
    _loaded: bool = False

    @classmethod
    def load_all(cls):
        """Load all models. Called once at app startup."""
        cls._load_sentiment()
        cls._load_sentence_model()
        cls._loaded = True

    @classmethod
    def _load_sentiment(cls):
        """
        Load IndoBERT fine-tuned for sentiment classification.
        Primary model: mdhuggins/indobert-sentiment
        Fallback:      distilbert/distilbert-base-multilingual-cased (if primary fails)
        """
        try:
            print("Loading sentiment model: mdhuggins/indobert-sentiment...")
            cls._sentiment_pipeline = pipeline(
                "text-classification",
                model="mdhuggins/indobert-sentiment",
                tokenizer="mdhuggins/indobert-sentiment",
                device=0 if torch.cuda.is_available() else -1,
                truncation=True,
                max_length=512,
            )
            print("  ✅  Sentiment model loaded.")
        except Exception as e:
            print(f"  ⚠️  Primary sentiment model failed ({e}). Loading multilingual fallback...")
            cls._sentiment_pipeline = pipeline(
                "text-classification",
                model="lxyuan/distilbert-base-multilingual-cased-sentiments-student",
                tokenizer="lxyuan/distilbert-base-multilingual-cased-sentiments-student",
                device=0 if torch.cuda.is_available() else -1,
                truncation=True,
                max_length=512,
            )
            print("  ✅  Fallback sentiment model loaded.")

    @classmethod
    def _load_sentence_model(cls):
        """Load multilingual sentence embeddings for BERTopic."""
        try:
            print("  📦  Loading sentence embedding model...")
            cls._sentence_model = SentenceTransformer(
                "paraphrase-multilingual-MiniLM-L12-v2"
            )
            print("  ✅  Sentence model loaded.")
        except Exception as e:
            print(f"  ⚠️  Sentence model failed to load: {e}")
            cls._sentence_model = None

    @classmethod
    def get_sentiment_pipeline(cls):
        if not cls._sentiment_pipeline:
            cls._load_sentiment()
        return cls._sentiment_pipeline

    @classmethod
    def get_sentence_model(cls):
        return cls._sentence_model

    @classmethod
    def is_loaded(cls) -> bool:
        return cls._loaded
