"""
TruthLens – Prediction Service
Loads the trained model + TF-IDF vectorizer and exposes a predict() function.
Auto-trains a model from sample data if no saved model is found.
"""

import json
import logging
import threading
from pathlib import Path
from typing import Optional

import joblib
import numpy as np

from app.config import get_settings
from app.services.nlp_service import (
    preprocess_for_prediction,
    extract_keywords,
    get_text_stats,
)
from app.schemas.prediction import PredictResponse, KeywordInfo

logger = logging.getLogger(__name__)
settings = get_settings()

MODELS_DIR = Path(__file__).parent.parent.parent / "ml" / "models"


class PredictionService:
    """Thread-safe singleton that holds the loaded model in memory."""

    _instance: Optional["PredictionService"] = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._model = None
                    cls._instance._vectorizer = None
                    cls._instance._metrics: dict = {}
                    cls._instance._loaded = False
        return cls._instance

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------

    def load(self) -> bool:
        """Load model and vectorizer from disk. Returns True on success."""
        model_path      = MODELS_DIR / "fake_news_model.pkl"
        vectorizer_path = MODELS_DIR / "tfidf_vectorizer.pkl"
        metrics_path    = MODELS_DIR / "metrics.json"

        if not model_path.exists() or not vectorizer_path.exists():
            logger.warning("Saved model not found – triggering auto-training ...")
            try:
                from ml.train import train
                self._model, self._vectorizer, self._metrics = train()
                self._loaded = True
                logger.info("Auto-training completed successfully.")
                return True
            except Exception as exc:
                logger.error("Auto-training failed: %s", exc)
                return False

        try:
            self._model      = joblib.load(model_path)
            self._vectorizer = joblib.load(vectorizer_path)
            if metrics_path.exists():
                with open(metrics_path) as f:
                    self._metrics = json.load(f)
            self._loaded = True
            logger.info("Model loaded from %s", model_path)
            return True
        except Exception as exc:
            logger.error("Failed to load model: %s", exc)
            return False

    @property
    def is_ready(self) -> bool:
        return self._loaded and self._model is not None and self._vectorizer is not None

    # ------------------------------------------------------------------
    # Prediction
    # ------------------------------------------------------------------

    def predict(self, headline: str, content: str) -> PredictResponse:
        """
        Run the full prediction pipeline.
        Returns a PredictResponse with prediction, confidence, and keywords.
        """
        if not self.is_ready:
            raise RuntimeError("Model is not loaded. Please train the model first.")

        # 1. NLP preprocessing
        clean = preprocess_for_prediction(headline, content)

        # 2. TF-IDF transform
        features = self._vectorizer.transform([clean])

        # 3. Predict
        label_pred = int(self._model.predict(features)[0])

        # 4. Probabilities
        try:
            proba = self._model.predict_proba(features)[0]
            fake_prob = float(proba[0])
            real_prob = float(proba[1])
        except AttributeError:
            # LinearSVC without calibration fallback
            decision = float(self._model.decision_function(features)[0])
            real_prob = float(1 / (1 + np.exp(-decision)))
            fake_prob = 1.0 - real_prob

        # 5. Confidence = probability of the predicted class
        confidence = real_prob if label_pred == 1 else fake_prob
        confidence = round(min(max(confidence, 0.0), 1.0), 4)

        # 6. Keywords for explainability
        raw_combined = f"{headline} {content}"
        kw_pairs = extract_keywords(raw_combined, top_n=10)
        keywords = [KeywordInfo(word=w, score=s) for w, s in kw_pairs]

        # 7. Preview of processed text
        preview = clean[:200] + "..." if len(clean) > 200 else clean

        return PredictResponse(
            prediction="REAL" if label_pred == 1 else "FAKE",
            confidence=confidence,
            label=label_pred,
            fake_probability=round(fake_prob, 4),
            real_probability=round(real_prob, 4),
            keywords=keywords,
            processed_text_preview=preview,
        )

    def get_metrics(self) -> dict:
        return self._metrics


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
prediction_service = PredictionService()
