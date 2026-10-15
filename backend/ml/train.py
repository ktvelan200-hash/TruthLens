"""
TruthLens – ML Model Training Script
Trains Logistic Regression, Naive Bayes, and Linear SVM on TF-IDF features.
Selects the best model by F1-score and saves it with the vectorizer.

Usage:
    python -m ml.train
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report,
)
from sklearn.calibration import CalibratedClassifierCV

from ml.preprocess import main as run_preprocess

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR    = Path(__file__).parent.parent / "data"
MODELS_DIR  = Path(__file__).parent / "models"
PROCESSED   = DATA_DIR / "processed_dataset.csv"

MODELS_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Feature Extraction
# ---------------------------------------------------------------------------

def build_tfidf(X_train: pd.Series) -> TfidfVectorizer:
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        sublinear_tf=True,        # apply log(1+tf) scaling
        min_df=2,                 # ignore very rare terms
        max_df=0.95,              # ignore near-universal terms
        strip_accents="unicode",
    )
    vectorizer.fit(X_train)
    return vectorizer


# ---------------------------------------------------------------------------
# Model Definitions
# ---------------------------------------------------------------------------

def get_candidates() -> dict:
    return {
        "LogisticRegression": LogisticRegression(
            max_iter=1000,
            C=1.0,
            solver="lbfgs",
            random_state=42,
            class_weight="balanced",
        ),
        "NaiveBayes": MultinomialNB(alpha=0.1),
        "LinearSVM": CalibratedClassifierCV(
            LinearSVC(
                max_iter=2000,
                C=1.0,
                random_state=42,
                class_weight="balanced",
            ),
            cv=3,
        ),
    }


# ---------------------------------------------------------------------------
# Evaluation helper
# ---------------------------------------------------------------------------

def evaluate_model(model, X_test, y_test, name: str) -> dict:
    y_pred = model.predict(X_test)
    metrics = {
        "name":      name,
        "accuracy":  round(accuracy_score(y_test, y_pred),  4),
        "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
        "recall":    round(recall_score(y_test, y_pred,    zero_division=0), 4),
        "f1":        round(f1_score(y_test, y_pred,        zero_division=0), 4),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    }
    logger.info(
        "%-20s | Acc: %.4f | Prec: %.4f | Rec: %.4f | F1: %.4f",
        name, metrics["accuracy"], metrics["precision"],
        metrics["recall"], metrics["f1"],
    )
    logger.info("\n%s", classification_report(y_test, y_pred, target_names=["FAKE", "REAL"]))
    return metrics


# ---------------------------------------------------------------------------
# Main Training Pipeline
# ---------------------------------------------------------------------------

def train():
    # 1. Load (or create) preprocessed data
    if not PROCESSED.exists():
        logger.info("Preprocessed dataset not found – running preprocessing ...")
        run_preprocess()

    df = pd.read_csv(PROCESSED)
    logger.info("Dataset loaded: %d rows", len(df))

    # 2. Split
    X = df["clean_text"].astype(str)
    y = df["label"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logger.info("Train: %d  |  Test: %d", len(X_train), len(X_test))

    # 3. TF-IDF
    logger.info("Building TF-IDF vectorizer ...")
    vectorizer = build_tfidf(X_train)
    X_train_tfidf = vectorizer.transform(X_train)
    X_test_tfidf  = vectorizer.transform(X_test)

    # 4. Train & evaluate all candidates
    candidates = get_candidates()
    all_metrics: list[dict] = []
    trained: dict = {}

    for name, model in candidates.items():
        logger.info("Training %s ...", name)
        model.fit(X_train_tfidf, y_train)
        metrics = evaluate_model(model, X_test_tfidf, y_test, name)
        all_metrics.append(metrics)
        trained[name] = model

    # 5. Select best model by F1
    best = max(all_metrics, key=lambda m: m["f1"])
    best_model = trained[best["name"]]
    logger.info("Best model: %s  (F1 = %.4f)", best["name"], best["f1"])

    # 6. Persist
    model_path      = MODELS_DIR / "fake_news_model.pkl"
    vectorizer_path = MODELS_DIR / "tfidf_vectorizer.pkl"
    metrics_path    = MODELS_DIR / "metrics.json"

    joblib.dump(best_model,  model_path)
    joblib.dump(vectorizer, vectorizer_path)

    metrics_data = {
        "best_model": best["name"],
        "best_metrics": best,
        "all_models": all_metrics,
        "dataset_size": len(df),
        "train_size": len(X_train),
        "test_size": len(X_test),
    }
    with open(metrics_path, "w") as f:
        json.dump(metrics_data, f, indent=2)

    logger.info("Model saved      → %s", model_path)
    logger.info("Vectorizer saved → %s", vectorizer_path)
    logger.info("Metrics saved    → %s", metrics_path)

    return best_model, vectorizer, metrics_data


if __name__ == "__main__":
    train()
