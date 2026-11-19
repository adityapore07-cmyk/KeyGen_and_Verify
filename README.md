# KeyGen_and_Verify

A learning project with a browser workbench and a Flask API for experimenting with three ciphers:

- **RSA**: public-key key generation, encryption and decryption.
- **AES-256-GCM**: authenticated symmetric encryption with tamper detection.
- **Hill cipher**: a classical matrix-based cipher for learning about modular arithmetic.

The web interface sends operations to the local Flask server. The command-line Python modules and Jupyter notebooks can also be used independently.

---

## Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Installation](#installation)
4. [Usage](#usage)
5. [API Reference](#api-reference)
6. [How the Algorithms Work](#how-the-algorithms-work)
7. [Security Notes](#security-notes)
8. [License](#license)

---

## Features

- A Flask server that serves the frontend and JSON API
- Browser workbench for RSA, AES-256-GCM and Hill cipher operations
- RSA key pair generation and short-message encryption/decryption
- AES key generation, encryption and authenticated decryption
- Hill key matrix generation, encryption and decryption
- Example Jupyter notebooks for step-by-step exploration

---

## Project Structure

| Path / file | Description |
| --- | --- |
| `app.py` | Flask application, static frontend server and `/api` endpoints |
| `frontend/index.html` | Workbench page and explanatory content |
| `frontend/app.js` | Workbench behavior and API requests |
| `frontend/styles.css` | Frontend styling |
| `aes/` | AES-256-GCM key generation, encryption, decryption and tests |
| `aes/generate_aes.py` | AES key generation |
| `aes/encrypt_aes.py`, `aes/decrypt_aes.py` | AES-GCM encryption and authenticated decryption |
| `aes/*_aes.ipynb` | AES notebooks |
| `aes/test_aes.py` | AES tests |
| `rsa/` | RSA key generation, encryption and decryption modules and notebooks |
| `rsa/generate_rsa.py` | RSA key pair generation |
| `rsa/encrypt_rsa.py`, `rsa/decrypt_rsa.py` | RSA encryption and decryption |
| `rsa/*_rsa.ipynb` | RSA notebooks |
| `hill/` | Hill cipher key generation, encryption and decryption modules and notebooks |
| `hill/generate_hill.py` | Hill key matrix generation and modular inverse helper |
| `hill/encrypt_hill.py`, `hill/decrypt_hill.py` | Hill cipher encryption and decryption |
| `hill/*_hill.ipynb` | Hill cipher notebooks |
| `requirements.txt` | Python package dependencies, including Flask |
| `LICENSE` | MIT license |

---

## Installation

Requires Python 3.8 or newer.

#### Windows

```bash
git clone https://github.com/adityapore07-cmyk/KeyGen_and_Verify.git
cd KeyGen_and_Verify
python -m venv .env
.env\Scripts\activate
pip install -r requirements.txt
```

#### MacOS

```bash
git clone https://github.com/adityapore07-cmyk/KeyGen_and_Verify.git
cd KeyGen_and_Verify
python3 -m venv .env
source .env\Scripts\activate
pip install -r requirements.txt
```

#### Linux

```bash
git clone https://github.com/adityapore07-cmyk/KeyGen_and_Verify.git
cd KeyGen_and_Verify
python3 -m venv .env
source .env/bin/activate
pip install -r requirements.txt
```

Main dependencies: [`pycryptodome`](https://pycryptodome.readthedocs.io/), [`sympy`](https://www.sympy.org/en/index.html), [`flask`](https://flask.palletsprojects.com/en/stable/)

---

## Usage

### Run the web workbench

#### Windows

```bash
.env\Scripts\activate
python app.py
```

#### MacOS

```bash
source .env\Scripts\activate
python3 app.py
```

#### Linux

```bash
source .env/bin/activate
python3 app.py
```

Open <http://127.0.0.1:5000>. The Flask server serves the frontend and provides
JSON endpoints for health checks and AES, RSA and Hill key generation,
encryption and decryption. For example:

```bash
curl http://127.0.0.1:5000/api/health
curl -X POST http://127.0.0.1:5000/api/aes/keygen \
  -H 'Content-Type: application/json' -d '{"bits":256}'
```

The routes follow `/api/<algorithm>/<operation>` for `keygen`, `encrypt` and
`decrypt` (`algorithm` is `aes`, `rsa` or `hill`), with `GET /api/health`.
AES values use hexadecimal strings; RSA key parameters are decimal strings;
Hill matrices can be supplied as `3,3;2,5` or as nested JSON arrays. RSA here
is textbook RSA without padding and is only suitable for this learning demo.

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

## API Reference

All operation endpoints accept and return JSON. The browser uses the same paths listed here.

| Method and path | Purpose |
| --- | --- |
| `GET /api/health` | Check that the server is running and list supported algorithms |
| `POST /api/<algorithm>/keygen` | Generate key material |
| `POST /api/<algorithm>/encrypt` | Encrypt plaintext |
| `POST /api/<algorithm>/decrypt` | Decrypt ciphertext |

Replace `<algorithm>` with `aes`, `rsa` or `hill`. Key generation accepts optional `bits` for AES (128, 192 or 256) and RSA (1024–4096, in multiples of 256), or optional `size` for Hill (2–8). For example:

```bash
curl -X POST http://127.0.0.1:5000/api/aes/encrypt \
  -H 'Content-Type: application/json' \
  -d '{"key":"<64 hex characters>","plaintext":"Hello"}'
```

AES keys, nonces, tags and ciphertext are hexadecimal strings. AES decryption requires `key`, `nonce`, `tag` and `ciphertext`. RSA encryption requires `plaintext` and a `key` object with decimal-string fields `n` and `e`; decryption requires `ciphertext` and a `key` object with `n` and `d`. Hill operations use a `key` matrix, encoded as a string such as `3,3;2,5` or as nested arrays, alongside `plaintext` or `ciphertext`.

Invalid input returns an HTTP 400 response with a JSON `error` field. Unknown algorithms return HTTP 404.

## How the Algorithms Work

### RSA

RSA creates a public key `(n, e)` and private key `(n, d)`. Encryption raises the message integer to `e` modulo `n`; decryption raises the ciphertext to `d` modulo `n`. The message must fit below the modulus. This project uses textbook RSA without padding, solely to demonstrate the underlying math.

### AES-256-GCM

AES uses a shared secret key. GCM adds authentication to encryption: each operation uses a nonce and returns a tag along with the ciphertext. Decryption verifies the tag before releasing plaintext. Never reuse a nonce with the same key.

### Hill cipher

The Hill cipher maps letters to numbers, groups them into blocks and multiplies each block by a square key matrix modulo 26. The matrix must be invertible modulo 26 for decryption. The implementation removes non-letter characters and pads plaintext to a full block with `X`.

---

## Security Notes

This project is for **learning**, not production use. The API binds to `127.0.0.1` by default and should not be exposed to an untrusted network.

- The RSA implementation is "textbook RSA" without padding (such as OAEP), which is insecure in practice. Its default 1024-bit key size is also too small for modern security.
- RSA messages must be smaller than the modulus `n`.
- For AES-GCM, never reuse a nonce with the same key.
- The Hill cipher is a classical teaching cipher and provides no modern security.
- Keep keys out of source control and never log them.
- For real applications, use well-reviewed libraries and protocols such as TLS rather than writing your own.

---

## License

Released under the [MIT License](LICENSE).
