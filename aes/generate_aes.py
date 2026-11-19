# PyCryptodome: cryptographically secure random bytes
from Crypto.Random import get_random_bytes


def generate_key(bits: int = 256) -> bytes:
    """Generate a random AES key of 128, 192 or 256 bits.

    The key comes from PyCryptodome's secure random generator, so it is
    never hard-coded and never repeated between calls.
    """
    if bits not in (128, 192, 256):
        raise ValueError("Key size must be 128, 192 or 256 bits")
    return get_random_bytes(bits // 8)
