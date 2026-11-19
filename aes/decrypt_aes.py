# PyCryptodome
from Crypto.Cipher import AES


def decrypt(key: bytes, nonce: bytes, ciphertext: bytes, tag: bytes,
            aad: bytes = b"") -> bytes:
    """Decrypt AES-GCM data produced by encrypt_aes.encrypt.

    The tag is verified before the plaintext is released, so any tampering
    with the ciphertext, tag or aad raises ValueError.
    """
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    cipher.update(aad)
    return cipher.decrypt_and_verify(ciphertext, tag)
