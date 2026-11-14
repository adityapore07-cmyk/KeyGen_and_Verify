from typing import Tuple

# PyCryptodome
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes


def encrypt(key: bytes, plaintext: bytes, aad: bytes = b"") -> Tuple[bytes, bytes, bytes]:
    """Encrypt plaintext with AES-GCM (authenticated encryption).

    A fresh random 12-byte nonce is generated for every call — reusing a
    (key, nonce) pair would break GCM's security completely.

    The optional `aad` (additional authenticated data) is authenticated
    but left unencrypted.

    Returns:
        (nonce, ciphertext, tag)
    """
    cipher = AES.new(key, AES.MODE_GCM, nonce=get_random_bytes(12))
    cipher.update(aad)  # authenticate the additional data
    ciphertext, tag = cipher.encrypt_and_digest(plaintext)
    return cipher.nonce, ciphertext, tag
