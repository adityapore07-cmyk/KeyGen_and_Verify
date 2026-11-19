from typing import Tuple

# SymPy
import sympy

# PyCryptodome
from Crypto.PublicKey import RSA

# Store the generated key
def generate_new_rsa_pair(len: int) -> Tuple:
    key_pair = RSA.generate(len)

    n = key_pair._n
    e = key_pair._e
    d = key_pair._d

    public_key = (n, e)
    private_key = (n, d)

    return (public_key, private_key, len)
