import math
import secrets
from typing import List

import sympy


def matrix_mod_inverse(matrix: List[List[int]], modulus: int = 26) -> List[List[int]]:

    m = sympy.Matrix(matrix)
    if m.rows != m.cols:
        raise ValueError(f"Key matrix must be square, got {m.rows}x{m.cols}")

    det = int(m.det()) % modulus
    g = math.gcd(det, modulus)
    if g != 1:
        raise ValueError(
            f"Matrix is not invertible mod {modulus}: "
            f"det ≡ {det} (mod {modulus}), gcd({det}, {modulus}) = {g} ≠ 1"
        )

    inv = m.inv_mod(modulus)
    return [[int(inv[r, c]) for c in range(inv.cols)] for r in range(inv.rows)]


def generate_key(n: int = 2) -> List[List[int]]:
    # nxn key matrix mod26.
    if n < 2:
        raise ValueError("Key matrix dimension n must be at least 2")

    while True:
        candidate = [[secrets.randbelow(26) for _ in range(n)] for _ in range(n)]
        det = int(sympy.Matrix(candidate).det()) % 26
        if math.gcd(det, 26) == 1:
            return candidate