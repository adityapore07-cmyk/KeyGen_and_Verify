"""Tests for the AES-GCM modules (run with: python -m pytest test_aes.py -v)."""
import pytest

from decrypt_aes import decrypt
from encrypt_aes import encrypt
from generate_aes import generate_key


def test_round_trip():
    """Encrypting and decrypting with the same key returns the original text."""
    key = generate_key()
    nonce, ciphertext, tag = encrypt(key, b"Hello, AES!")

    assert decrypt(key, nonce, ciphertext, tag) == b"Hello, AES!"


def test_invalid_key_size_rejected():
    """Key sizes other than 128/192/256 bits are not allowed."""
    with pytest.raises(ValueError):
        generate_key(100)


def test_wrong_key_fails():
    """A different key cannot read someone else's ciphertext."""
    nonce, ciphertext, tag = encrypt(generate_key(), b"secret message")

    with pytest.raises(ValueError):
        decrypt(generate_key(), nonce, ciphertext, tag)


def test_tampered_ciphertext_fails():
    """Flipping one byte of the ciphertext must be detected."""
    key = generate_key()
    nonce, ciphertext, tag = encrypt(key, b"secret message")

    bad_ciphertext = bytearray(ciphertext)
    bad_ciphertext[0] ^= 0xFF

    with pytest.raises(ValueError):
        decrypt(key, nonce, bytes(bad_ciphertext), tag)


def test_tampered_tag_fails():
    """Flipping one byte of the tag must be detected."""
    key = generate_key()
    nonce, ciphertext, tag = encrypt(key, b"secret message")

    bad_tag = bytearray(tag)
    bad_tag[0] ^= 0xFF

    with pytest.raises(ValueError):
        decrypt(key, nonce, ciphertext, bytes(bad_tag))


def test_new_nonce_and_ciphertext_every_time():
    """Two encryptions of the same plaintext must differ (fresh nonce)."""
    key = generate_key()

    nonce1, ciphertext1, _ = encrypt(key, b"same message")
    nonce2, ciphertext2, _ = encrypt(key, b"same message")

    assert nonce1 != nonce2
    assert ciphertext1 != ciphertext2
