"""Collision-free session ID generator."""

import string

from nanoid import generate

ALPHABET = string.ascii_uppercase + string.digits
SESSION_ID_LENGTH = 8


def generate_session_id() -> str:
    """Generate a short, URL-safe session ID (e.g., 'A3K9X2BF')."""
    return generate(ALPHABET, SESSION_ID_LENGTH)
