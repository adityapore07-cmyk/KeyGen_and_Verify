import math
from typing import List, Tuple

import sympy

from hill.generate_hill import generate_key


def clean_and_pad_text(text: str, block_size: int, pad_char: str = "X") -> str:
    cleaned = "".join(ch.upper() for ch in text if ch.isalpha())
    if not cleaned:
        raise ValueError("Plaintext must contain at least one alphabetic character")

    remainder = len(cleaned) % block_size
    if remainder != 0:
        cleaned += pad_char.upper() * (block_size - remainder)
    return cleaned


def encrypt(key: List[List[int]], plaintext: str, pad_char: str = "X") -> str:

    matrix = sympy.Matrix(key)
    if matrix.rows != matrix.cols:
        raise ValueError("Key matrix must be square")

    n = matrix.rows
    det = int(matrix.det()) % 26
    if math.gcd(det, 26) != 1:
        raise ValueError(f"Key matrix is not invertible mod 26 (gcd({det}, 26) != 1)")

    padded = clean_and_pad_text(plaintext, n, pad_char)
    ciphertext_chars = []

    for i in range(0, len(padded), n):
        block = [ord(ch) - ord("A") for ch in padded[i : i + n]]
        col = sympy.Matrix(block)
        res = (matrix * col) % 26
        ciphertext_chars.extend(chr(int(v) + ord("A")) for v in res)

    return "".join(ciphertext_chars)


def encrypt_message(text: str, n: int = 2) -> Tuple[str, List[List[int]]]:
    key = generate_key(n)
    ciphertext = encrypt(key, text)
    return ciphertext, key