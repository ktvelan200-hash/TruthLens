"""
Tests for the NLP preprocessing pipeline.
"""
import pytest
from app.services.nlp_service import (
    clean_text,
    combine_headline_content,
    preprocess_for_prediction,
    extract_keywords,
    get_text_stats,
)


class TestCleanText:
    def test_lowercase(self):
        assert clean_text("HELLO WORLD") == clean_text("hello world")

    def test_removes_html(self):
        result = clean_text("<b>Breaking News</b>: scientists discover")
        assert "<b>" not in result
        assert "breaking" in result or "news" in result

    def test_removes_urls(self):
        result = clean_text("Visit https://example.com for more info")
        assert "http" not in result
        assert "example.com" not in result

    def test_removes_punctuation(self):
        result = clean_text("BREAKING!!! Scientists discover NEW cure!!!")
        assert "!" not in result
        assert "breaking" in result

    def test_removes_stopwords(self):
        result = clean_text("this is a very simple test of the system")
        # Common stop words should be removed
        assert " is " not in f" {result} "
        assert " the " not in f" {result} "

    def test_lemmatization(self):
        result = clean_text("Scientists discovered discovering discoveries")
        # All forms should reduce to 'discover' or 'discoveri'
        tokens = result.split()
        assert any("discover" in t for t in tokens)

    def test_empty_string(self):
        assert clean_text("") == ""

    def test_none_input(self):
        assert clean_text(None) == ""  # type: ignore

    def test_non_english_characters_removed(self):
        result = clean_text("café naïve résumé")
        assert "é" not in result

    def test_short_tokens_removed(self):
        result = clean_text("I go to a big red house")
        tokens = result.split()
        # Tokens with length < 3 should be removed
        assert all(len(t) >= 3 for t in tokens)

    def test_whitespace_collapsed(self):
        result = clean_text("too    many     spaces")
        assert "  " not in result


class TestCombineHeadlineContent:
    def test_headline_repeated_three_times(self):
        h = "Breaking News"
        c = "Some article content here"
        combined = combine_headline_content(h, c)
        assert combined.count("Breaking News") == 3

    def test_empty_content(self):
        result = combine_headline_content("Headline Only", "")
        assert "Headline Only" in result

    def test_empty_headline(self):
        result = combine_headline_content("", "Just content")
        assert "Just content" in result


class TestPreprocessForPrediction:
    def test_returns_string(self):
        result = preprocess_for_prediction("Headline", "Content here")
        assert isinstance(result, str)

    def test_non_empty_output(self):
        result = preprocess_for_prediction(
            "Scientists discover new planet",
            "Astronomers at NASA have announced the discovery of a new planet in our solar system."
        )
        assert len(result.strip()) > 0

    def test_fake_news_pattern(self):
        result = preprocess_for_prediction(
            "SHOCKING SECRET EXPOSED!!!",
            "The deep state has been hiding this miracle cure from the public. Share before deleted!"
        )
        # Should contain key stemmed/lemmatized words
        assert isinstance(result, str)
        assert len(result) > 0


class TestExtractKeywords:
    def test_returns_list(self):
        result = extract_keywords("scientists discover new vaccine breakthrough treatment")
        assert isinstance(result, list)

    def test_top_n_limit(self):
        text = " ".join(["word"] * 50 + ["unique"] * 5 + ["rare"] * 2)
        result = extract_keywords(text, top_n=5)
        assert len(result) <= 5

    def test_returns_tuples(self):
        result = extract_keywords("sample text for keyword extraction analysis")
        for item in result:
            assert len(item) == 2
            word, score = item
            assert isinstance(word, str)
            assert 0.0 <= score <= 1.0

    def test_empty_text(self):
        result = extract_keywords("")
        assert result == []


class TestGetTextStats:
    def test_word_count(self):
        stats = get_text_stats("one two three four five")
        assert stats["word_count"] == 5

    def test_exclamation_count(self):
        stats = get_text_stats("Wow! Amazing! Great!")
        assert stats["exclamation_count"] == 3

    def test_question_count(self):
        stats = get_text_stats("What? Why? How?")
        assert stats["question_count"] == 3

    def test_caps_heavy_detection(self):
        # All-caps string should be flagged
        stats = get_text_stats("BREAKING NEWS THIS IS SHOCKING")
        assert stats["has_caps_heavy"] is True

    def test_normal_text_not_caps_heavy(self):
        stats = get_text_stats("This is a normal sentence with proper capitalization.")
        assert stats["has_caps_heavy"] is False
