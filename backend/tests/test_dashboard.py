"""
Tests for the dashboard statistics endpoint.
GET /api/dashboard
"""
import pytest


class TestDashboard:
    def test_dashboard_requires_auth(self, client):
        r = client.get("/api/dashboard")
        assert r.status_code == 401

    def test_dashboard_authenticated(self, client, auth_headers):
        r = client.get("/api/dashboard", headers=auth_headers)
        assert r.status_code == 200

    def test_dashboard_response_shape(self, client, auth_headers):
        r = client.get("/api/dashboard", headers=auth_headers)
        assert r.status_code == 200
        body = r.json()

        required_keys = [
            "total_analyzed", "real_count", "fake_count",
            "avg_confidence", "real_percentage", "fake_percentage",
            "daily_stats",
        ]
        for key in required_keys:
            assert key in body, f"Missing key: {key}"

    def test_dashboard_counts_consistent(self, client, auth_headers):
        r = client.get("/api/dashboard", headers=auth_headers)
        body = r.json()
        assert body["real_count"] + body["fake_count"] == body["total_analyzed"]

    def test_dashboard_percentages_sum_to_100(self, client, auth_headers):
        r = client.get("/api/dashboard", headers=auth_headers)
        body = r.json()
        if body["total_analyzed"] > 0:
            total_pct = body["real_percentage"] + body["fake_percentage"]
            assert abs(total_pct - 100.0) < 0.5, f"Percentages sum to {total_pct}"

    def test_dashboard_avg_confidence_range(self, client, auth_headers):
        r = client.get("/api/dashboard", headers=auth_headers)
        body = r.json()
        assert 0.0 <= body["avg_confidence"] <= 1.0

    def test_dashboard_daily_stats_length(self, client, auth_headers):
        r = client.get("/api/dashboard", headers=auth_headers)
        body = r.json()
        # Should have exactly 14 days
        assert len(body["daily_stats"]) == 14

    def test_dashboard_daily_stats_shape(self, client, auth_headers):
        r = client.get("/api/dashboard", headers=auth_headers)
        body = r.json()
        for day in body["daily_stats"]:
            assert "date" in day
            assert "real_count" in day
            assert "fake_count" in day
            assert day["real_count"] >= 0
            assert day["fake_count"] >= 0


class TestHealthEndpoint:
    def test_health_check(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        body = r.json()
        assert "status" in body
        assert body["status"] == "ok"
        assert "db_connected" in body
        assert "model_ready" in body

    def test_root_endpoint(self, client):
        r = client.get("/")
        assert r.status_code == 200
        body = r.json()
        assert "TruthLens" in body.get("app", "")
        assert "docs" in body
