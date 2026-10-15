"""
Tests for prediction history endpoints.
GET    /api/history
GET    /api/history/count
GET    /api/history/{id}
DELETE /api/history/{id}
DELETE /api/history
"""
import pytest


class TestHistoryRequiresAuth:
    def test_get_history_unauthenticated(self, client):
        r = client.get("/api/history")
        assert r.status_code == 401

    def test_delete_history_unauthenticated(self, client):
        r = client.delete("/api/history")
        assert r.status_code == 401


class TestHistoryOperations:
    @pytest.fixture(autouse=True)
    def seed_prediction(self, client, auth_headers):
        """Ensure at least one prediction exists before each test."""
        r = client.post("/api/predict", json={
            "headline": "History test article headline here",
            "content": (
                "This is sample content for the history test. "
                "Scientists have discovered a significant breakthrough in renewable energy. "
                "The research was published in Nature journal this week."
            ),
        }, headers=auth_headers)
        # Accept 200 or 503 (model not available); history tests still work
        self.predict_available = r.status_code == 200

    def test_get_history_returns_list(self, client, auth_headers):
        r = client.get("/api/history", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_history_item_shape(self, client, auth_headers):
        r = client.get("/api/history", headers=auth_headers)
        assert r.status_code == 200
        items = r.json()
        if not items:
            pytest.skip("No history items to inspect")
        item = items[0]
        assert "id" in item
        assert "headline" in item
        assert "prediction" in item
        assert item["prediction"] in ("REAL", "FAKE")
        assert "confidence" in item
        assert "created_at" in item

    def test_filter_by_real(self, client, auth_headers):
        r = client.get("/api/history?filter_by=REAL", headers=auth_headers)
        assert r.status_code == 200
        for item in r.json():
            assert item["prediction"] == "REAL"

    def test_filter_by_fake(self, client, auth_headers):
        r = client.get("/api/history?filter_by=FAKE", headers=auth_headers)
        assert r.status_code == 200
        for item in r.json():
            assert item["prediction"] == "FAKE"

    def test_search_by_headline(self, client, auth_headers):
        r = client.get("/api/history?search=History+test", headers=auth_headers)
        assert r.status_code == 200
        # If any results come back they must match the search
        for item in r.json():
            assert "History test" in item["headline"] or "history test" in item["headline"].lower()

    def test_pagination(self, client, auth_headers):
        r = client.get("/api/history?page=1&page_size=2", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) <= 2

    def test_get_count(self, client, auth_headers):
        r = client.get("/api/history/count", headers=auth_headers)
        assert r.status_code == 200
        body = r.json()
        assert "total" in body
        assert "real" in body
        assert "fake" in body
        assert body["total"] == body["real"] + body["fake"]

    def test_get_by_id(self, client, auth_headers):
        items = client.get("/api/history", headers=auth_headers).json()
        if not items:
            pytest.skip("No history items")
        item_id = items[0]["id"]
        r = client.get(f"/api/history/{item_id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["id"] == item_id

    def test_get_by_nonexistent_id(self, client, auth_headers):
        r = client.get("/api/history/999999", headers=auth_headers)
        assert r.status_code == 404

    def test_delete_single(self, client, auth_headers):
        # Add a prediction specifically to delete
        items_before = client.get("/api/history", headers=auth_headers).json()
        if not items_before:
            pytest.skip("No items to delete")
        item_id = items_before[0]["id"]
        r = client.delete(f"/api/history/{item_id}", headers=auth_headers)
        assert r.status_code == 204
        # Confirm gone
        r2 = client.get(f"/api/history/{item_id}", headers=auth_headers)
        assert r2.status_code == 404

    def test_delete_nonexistent(self, client, auth_headers):
        r = client.delete("/api/history/999999", headers=auth_headers)
        assert r.status_code == 404

    def test_clear_all(self, client, auth_headers):
        r = client.delete("/api/history", headers=auth_headers)
        assert r.status_code == 204
        r2 = client.get("/api/history", headers=auth_headers)
        assert r2.json() == []
