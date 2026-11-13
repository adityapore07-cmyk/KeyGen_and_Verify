from typing import Tuple

# SymPy
import sympy

# PyCryptodome
from Crypto.PublicKey import RSA

# Store the generated key
def generate_new_pair(len: int) -> Tuple:
    key_pair = RSA.generate(len)

    n = key_pair._n
    e = key_pair._e
    d = key_pair._d

    private_key = (n, e)
    public_key = (n, d)

    return (private_key, public_key, len)