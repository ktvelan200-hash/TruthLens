"""
Tests for the prediction endpoint and prediction service.
POST /api/predict
GET  /api/model/info
"""
import pytest


REAL_ARTICLE = {
    "headline": "Federal Reserve raises interest rates by 25 basis points",
    "content": (
        "The Federal Reserve raised its benchmark interest rate by a quarter percentage point "
        "on Wednesday, continuing its campaign to reduce inflation. The decision was unanimous. "
        "Fed Chair Jerome Powell indicated further increases may be necessary depending on "
        "incoming economic data including employment figures and consumer price indexes."
    ),
}

FAKE_ARTICLE = {
    "headline": "BREAKING: Secret government mind-control program exposed by whistleblower",
    "content": (
        "Anonymous sources reveal that the deep state has been running a secret program to "
        "control citizens through 5G towers. The mainstream media is suppressing this story. "
        "Documents show the program was personally authorized. Share before it is deleted! "
        "Wake up sheeple, do your own research and spread the truth before they silence us all."
    ),
}


class TestPredictEndpoint:
    def test_predict_returns_200(self, client):
        r = client.post("/api/predict", json=REAL_ARTICLE)
        # 200 if model loaded, 503 if model not yet trained
        assert r.status_code in (200, 503), r.text

    def test_predict_response_shape(self, client):
        r = client.post("/api/predict", json=REAL_ARTICLE)
        if r.status_code == 503:
            pytest.skip("Model not available in this test environment")
        body = r.json()
        assert "prediction" in body
        assert body["prediction"] in ("REAL", "FAKE")
        assert "confidence" in body
        assert 0.0 <= body["confidence"] <= 1.0
        assert "label" in body
        assert body["label"] in (0, 1)
        assert "fake_probability" in body
        assert "real_probability" in body
        assert "keywords" in body
        assert isinstance(body["keywords"], list)

    def test_predict_probabilities_sum_to_one(self, client):
        r = client.post("/api/predict", json=REAL_ARTICLE)
        if r.status_code == 503:
            pytest.skip("Model not available")
        body = r.json()
        total = body["fake_probability"] + body["real_probability"]
        assert abs(total - 1.0) < 0.01, f"Probabilities sum to {total}"

    def test_predict_headline_too_short(self, client):
        r = client.post("/api/predict", json={"headline": "Hi", "content": "x" * 50})
        assert r.status_code == 422

    def test_predict_content_too_short(self, client):
        r = client.post("/api/predict", json={
            "headline": "A valid headline here",
            "content": "short",
        })
        assert r.status_code == 422

    def test_predict_missing_headline(self, client):
        r = client.post("/api/predict", json={"content": "Some content here that is long enough"})
        assert r.status_code == 422

    def test_predict_missing_content(self, client):
        r = client.post("/api/predict", json={"headline": "A valid headline here"})
        assert r.status_code == 422

    def test_predict_empty_body(self, client):
        r = client.post("/api/predict", json={})
        assert r.status_code == 422

    def test_predict_with_optional_fields(self, client):
        payload = {
            **REAL_ARTICLE,
            "source": "Reuters",
            "article_url": "https://reuters.com/article/123",
            "author": "Jane Doe",
            "published_at": "2026-10-01T12:00:00Z",
        }
        r = client.post("/api/predict", json=payload)
        assert r.status_code in (200, 503), r.text

    def test_predict_saves_to_history_when_authenticated(self, client, auth_headers):
        r = client.post("/api/predict", json=REAL_ARTICLE, headers=auth_headers)
        if r.status_code == 503:
            pytest.skip("Model not available")
        assert r.status_code == 200
        # Verify it appears in history
        hist = client.get("/api/history", headers=auth_headers)
        assert hist.status_code == 200
        items = hist.json()
        headlines = [i["headline"] for i in items]
        assert REAL_ARTICLE["headline"] in headlines


class TestModelInfo:
    def test_model_info_endpoint(self, client):
        r = client.get("/api/model/info")
        assert r.status_code == 200
        body = r.json()
        assert "model_ready" in body
        assert isinstance(body["model_ready"], bool)
        assert "metrics" in body
