"""
TruthLens – Model Evaluation Script
Loads the saved model and prints a detailed evaluation report.

Usage:
    python -m ml.evaluate
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import logging
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent / "models"
DATA_DIR   = Path(__file__).parent.parent / "data"


def evaluate():
    model_path      = MODELS_DIR / "fake_news_model.pkl"
    vectorizer_path = MODELS_DIR / "tfidf_vectorizer.pkl"
    metrics_path    = MODELS_DIR / "metrics.json"
    processed_csv   = DATA_DIR   / "processed_dataset.csv"

    if not model_path.exists():
        logger.error("Model not found. Run `python -m ml.train` first.")
        return

    logger.info("Loading saved model and vectorizer ...")
    model      = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)

    if not processed_csv.exists():
        logger.error("Processed dataset not found. Run `python -m ml.preprocess` first.")
        return

    df = pd.read_csv(processed_csv)
    X  = df["clean_text"].astype(str)
    y  = df["label"].astype(int)

    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    X_test_tfidf = vectorizer.transform(X_test)
    y_pred = model.predict(X_test_tfidf)

    print("\n" + "=" * 60)
    print("  TruthLens – Model Evaluation Report")
    print("=" * 60)
    print(classification_report(y_test, y_pred, target_names=["FAKE", "REAL"]))

    cm = confusion_matrix(y_test, y_pred)
    print("Confusion Matrix:")
    print(f"          Pred FAKE  Pred REAL")
    print(f"True FAKE    {cm[0][0]:5d}      {cm[0][1]:5d}")
    print(f"True REAL    {cm[1][0]:5d}      {cm[1][1]:5d}")

    if metrics_path.exists():
        with open(metrics_path) as f:
            m = json.load(f)
        print(f"\nBest model: {m['best_model']}")
        print(f"F1 Score  : {m['best_metrics']['f1']}")
        print(f"Accuracy  : {m['best_metrics']['accuracy']}")

    print("=" * 60)


if __name__ == "__main__":
    evaluate()
