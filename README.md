# KeyGen_and_Verify

A small educational Python project that demonstrates two cryptographic building blocks used in real systems today:

- **RSA**: public-key (asymmetric) key generation, encryption and decryption, built to show the underlying math.
- **AES-256-GCM**: modern authenticated symmetric encryption, which encrypts data *and* verifies it has not been tampered with.

Together they mirror how secure systems such as HTTPS/TLS work: RSA (or a similar scheme) shares a secret key, and AES encrypts the actual data with it.

---

## Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Installation](#installation)
4. [Usage](#usage)
5. [How RSA Works](#how-rsa-works)
6. [How AES-256-GCM Works](#how-aes-256-gcm-works)
7. [RSA vs AES](#rsa-vs-aes)
8. [Security Notes](#security-notes)
9. [License](#license)

---

## Features

- RSA key pair generation (`n`, `e`, `d`) using PyCryptodome
- RSA encryption and decryption of short messages
- AES-256-GCM key generation, encryption and decryption
- Built-in tamper detection through the GCM authentication tag
- Jupyter notebook versions of the scripts for step-by-step exploration

---

## Project Structure

| File | Description |
|---|---|
| `generate.py` | Generates an RSA key pair |
| `encrypt.py` | Encrypts a message with RSA |
| `decrypt.py` | Decrypts an RSA message and prints the original, encrypted and decrypted text |
| `generate_aes.py` | Generates a random 256-bit AES key |
| `encrypt_aes.py` | Encrypts data with AES-256-GCM |
| `decrypt_aes.py` | Decrypts and verifies data with AES-256-GCM |
| `*.ipynb` | Notebook versions of the scripts |
| `requirements.txt` | Python dependencies |
| `LICENSE` | MIT license |

---

## Installation

Requires Python 3.8 or newer.

```bash
git clone https://github.com/adityapore07-cmyk/KeyGen_and_Verify.git
cd KeyGen_and_Verify
pip install -r requirements.txt
```

Main dependency: [`pycryptodome`](https://pycryptodome.readthedocs.io/)

---

## Usage

### RSA

```python
from decrypt import decrypt

decrypt("Hello, RSA!")
```

Example output:

```
Original Text:  Hello, RSA!
Encrypted Text: 1234567890...   (large integer)
Decrypted Text: Hello, RSA!
```

### AES-256-GCM

```python
from generate_aes import generate_key
from encrypt_aes import encrypt
from decrypt_aes import decrypt

key = generate_key()
nonce, ciphertext, tag = encrypt(key, "Hello, AES!".encode())
print(decrypt(key, nonce, ciphertext, tag).decode())
```

Example output:

```
Hello, AES!
```

If the ciphertext, nonce or tag is changed in any way, decryption raises a `ValueError` instead of returning corrupted data.

---

## How RSA Works

RSA is based on the fact that multiplying two large primes is easy, but factoring their product is extremely hard.

**Key generation**

1. Pick two large primes `p` and `q`.
2. Compute `n = p × q`.
3. Compute `φ(n) = (p − 1)(q − 1)`.
4. Choose a public exponent `e` (commonly 65537) that is coprime with `φ(n)`.
5. Compute the private exponent `d` such that `e × d ≡ 1 (mod φ(n))`.

The public key is `(n, e)` and the private key is `(n, d)`.

**Encryption and decryption**

```
ciphertext = message^e mod n
message    = ciphertext^d mod n
```

**Tiny example:** `p = 3`, `q = 11`, so `n = 33` and `φ = 20`. With `e = 3` we get `d = 7`. Encrypting `4` gives `4³ mod 33 = 31`, and decrypting gives `31⁷ mod 33 = 4`.

---

## How AES-256-GCM Works

AES is a symmetric block cipher: the same secret key encrypts and decrypts. **GCM** (Galois/Counter Mode) turns it into an *authenticated* cipher.

| Component | Purpose |
|---|---|
| **Key** (256 bits) | The shared secret. Must be kept private. |
| **Nonce** (96 bits) | A unique value per message. Must never be reused with the same key. |
| **Ciphertext** | The encrypted data, the same length as the plaintext. |
| **Tag** (128 bits) | An authentication tag proving the data and nonce were not altered. |

Why it is widely used today:

- It is the default cipher in TLS 1.3 and HTTPS.
- It is used in WPA3 Wi-Fi, VPNs and disk encryption.
- Modern CPUs have hardware instructions (AES-NI) that make it very fast.
- It provides both confidentiality and integrity in one step.

---

## RSA vs AES

| | RSA | AES-256-GCM |
|---|---|---|
| Type | Asymmetric (public/private keys) | Symmetric (one shared key) |
| Speed | Slow | Very fast |
| Message size | Limited by key size | Practically unlimited |
| Typical role | Key exchange, digital signatures | Bulk data encryption |
| Tamper detection | Needs signatures or padding | Built in (auth tag) |

---

## Security Notes

This project is for **learning**, not production use.

- The RSA implementation is "textbook RSA" without padding (such as OAEP), which is insecure in practice.
- RSA messages must be smaller than the modulus `n`.
- 1024-bit RSA keys are considered weak; use 2048 bits or more in real systems.
- For AES-GCM, never reuse a nonce with the same key.
- Keep keys out of source control and never log them.
- For real applications, use well-reviewed libraries and protocols such as TLS rather than writing your own.

---

## License

Released under the [MIT License](LICENSE).
