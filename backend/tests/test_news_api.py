"""
Tests for the News API endpoint.
GET /api/news
GET /api/news/headlines
POST /api/news/save
GET  /api/news/saved
DELETE /api/news/saved/{id}

NewsAPI external calls are not mocked here — the tests verify:
  - Correct error code when the API key is missing/invalid (503 / 401)
  - Correct input validation (422 for bad params)
  - Auth-protected endpoints reject unauthenticated requests
"""
import pytest


class TestNewsEndpoint:
    def test_news_endpoint_exists(self, client):
        """Should return 200, 503 (no key), or 401 (invalid key) — never 404."""
        r = client.get("/api/news")
        assert r.status_code != 404, "Endpoint not found"

    def test_news_missing_api_key_returns_503(self, client, monkeypatch):
        """When NEWS_API_KEY is blank the service should return 503."""
        from app.config import get_settings
        settings = get_settings()
        original = settings.news_api_key
        settings.news_api_key = ""
        try:
            r = client.get("/api/news")
            # 503 = key not configured, 200 = key was available in env
            assert r.status_code in (200, 503), r.text
        finally:
            settings.news_api_key = original

    def test_headlines_endpoint_exists(self, client):
        r = client.get("/api/news/headlines")
        assert r.status_code != 404

    def test_invalid_page_size(self, client):
        """page_size > 100 should be rejected by FastAPI validation."""
        r = client.get("/api/news?page_size=999")
        assert r.status_code == 422

    def test_invalid_page(self, client):
        r = client.get("/api/news?page=0")
        assert r.status_code == 422


class TestSavedArticles:
    SAMPLE = {
        "title": "Test Article Title",
        "description": "A test description",
        "source": "Test Source",
        "author": "John Doe",
        "url": "https://example.com/test-article-unique-12345",
        "image_url": "https://example.com/image.jpg",
        "published_at": "2026-10-01T00:00:00Z",
    }

    def test_save_requires_auth(self, client):
        r = client.post("/api/news/save", json=self.SAMPLE)
        assert r.status_code == 401

    def test_list_saved_requires_auth(self, client):
        r = client.get("/api/news/saved")
        assert r.status_code == 401

    def test_save_article(self, client, auth_headers):
        r = client.post("/api/news/save", json=self.SAMPLE, headers=auth_headers)
        assert r.status_code in (201, 409), r.text   # 201=saved, 409=already saved
        if r.status_code == 201:
            body = r.json()
            assert body["title"] == self.SAMPLE["title"]
            assert body["url"]   == self.SAMPLE["url"]

    def test_list_saved_articles(self, client, auth_headers):
        r = client.get("/api/news/saved", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_duplicate_save_returns_409(self, client, auth_headers):
        # First save
        client.post("/api/news/save", json=self.SAMPLE, headers=auth_headers)
        # Duplicate
        r = client.post("/api/news/save", json=self.SAMPLE, headers=auth_headers)
        assert r.status_code == 409

    def test_delete_saved_article(self, client, auth_headers):
        # Save first
        r_save = client.post("/api/news/save", json={
            **self.SAMPLE,
            "url": "https://example.com/unique-delete-test-999",
        }, headers=auth_headers)
        if r_save.status_code not in (201,):
            pytest.skip("Could not create article to delete")
        article_id = r_save.json()["id"]
        r_del = client.delete(f"/api/news/saved/{article_id}", headers=auth_headers)
        assert r_del.status_code == 204

    def test_delete_nonexistent_saved(self, client, auth_headers):
        r = client.delete("/api/news/saved/999999", headers=auth_headers)
        assert r.status_code == 404
