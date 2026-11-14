from typing import List

import sympy

from encrypt_hill import encrypt_message
from generate_hill import matrix_mod_inverse


def decrypt(key: List[List[int]], ciphertext: str) -> str:
    # P = (K^(-1)*C) mod26 for each n.
    matrix = sympy.Matrix(key)
    if matrix.rows != matrix.cols:
        raise ValueError("Key matrix must be square")

    n = matrix.rows
    inv_key = matrix_mod_inverse(key, 26)
    inv_matrix = sympy.Matrix(inv_key)

    cleaned = "".join(ch.upper() for ch in ciphertext if ch.isalpha())
    if len(cleaned) % n != 0:
        raise ValueError(
            f"Ciphertext length ({len(cleaned)}) must be a multiple of key size ({n})"
        )

    plaintext_chars = []
    for i in range(0, len(cleaned), n):
        block = [ord(ch) - ord("A") for ch in cleaned[i : i + n]]
        col = sympy.Matrix(block)
        res = (inv_matrix * col) % 26
        plaintext_chars.extend(chr(int(v) + ord("A")) for v in res)

    return "".join(plaintext_chars)


def decrypt_message(msg: str, n: int = 2) -> str:
    ciphertext, key = encrypt_message(msg, n)
    decrypted = decrypt(key, ciphertext)

    print("Original Text: ", msg)
    print("Key Matrix:    ", key)
    print("Encrypted Text:", ciphertext)
    print("Decrypted Text:", decrypted)

    return decrypted