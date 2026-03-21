"""Pytest configuration - mock Firebase init for tests."""

import pytest
from unittest.mock import patch


@pytest.fixture(autouse=True)
def mock_firebase():
    """Prevent Firebase init during tests."""
    with patch("app.db.data.init_firebase"):
        yield
