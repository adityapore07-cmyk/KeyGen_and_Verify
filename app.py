"""Small Flask API and static frontend server for the cryptography demo."""

from __future__ import annotations

import base64
import binascii
import math
import re
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from aes.decrypt_aes import decrypt as aes_decrypt
from hill.decrypt_hill import decrypt as hill_decrypt
from aes.encrypt_aes import encrypt as aes_encrypt
from hill.encrypt_hill import encrypt as hill_encrypt
from aes.generate_aes import generate_key as generate_aes_key
from hill.generate_hill import generate_key as generate_hill_key
from rsa.generate_rsa import generate_new_rsa_pair

ROOT = Path(__file__).resolve().parent
app = Flask(__name__, static_folder="frontend", static_url_path="")


def require_json() -> dict:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValueError("Request body must be a JSON object")
    return data


def required_text(data: dict, field: str) -> str:
    value = data.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"'{field}' is required and must be a non-empty string")
    return value.strip()


def decode_hex(data: dict, field: str) -> bytes:
    value = required_text(data, field).removeprefix("0x")
    try:
        return bytes.fromhex(value)
    except ValueError as exc:
        raise ValueError(f"'{field}' must be valid hexadecimal") from exc


def parse_matrix(value: object) -> list[list[int]]:
    if not isinstance(value, (str, list)):
        raise ValueError("'key' must be a matrix such as '3,3;2,5'")
    try:
        if isinstance(value, str):
            matrix = [[int(item.strip()) for item in row.split(",")] for row in value.split(";")]
        else:
            matrix = [[int(item) for item in row] for row in value]
    except (TypeError, ValueError) as exc:
        raise ValueError("'key' must contain integer matrix entries") from exc
    if not matrix or any(len(row) != len(matrix) for row in matrix):
        raise ValueError("'key' must be a non-empty square matrix")
    return matrix


@app.get("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.get("/api/health")
def health():
    return jsonify(status="ok", algorithms=["aes", "rsa", "hill"])


@app.post("/api/<algorithm>/keygen")
def keygen(algorithm: str):
    data = request.get_json(silent=True) or {}
    if algorithm == "aes":
        bits = data.get("bits", 256)
        if bits not in (128, 192, 256):
            raise ValueError("'bits' must be 128, 192 or 256")
        key = generate_aes_key(bits)
        return jsonify(key=key.hex(), bits=bits)
    if algorithm == "rsa":
        bits = data.get("bits", 1024)
        if not isinstance(bits, int) or bits < 1024 or bits > 4096 or bits % 256:
            raise ValueError("'bits' must be a multiple of 256 from 1024 to 4096")
        (n, e), (_, d), _ = generate_new_rsa_pair(bits)
        return jsonify(public_key={"n": str(n), "e": str(e)}, private_key={"n": str(n), "d": str(d)})
    if algorithm == "hill":
        size = data.get("size", 2)
        if not isinstance(size, int) or not 2 <= size <= 8:
            raise ValueError("'size' must be an integer from 2 to 8")
        return jsonify(key=generate_hill_key(size))
    return jsonify(error="Unknown algorithm. Use aes, rsa or hill."), 404


@app.post("/api/<algorithm>/encrypt")
def encrypt(algorithm: str):
    data = require_json()
    plaintext = required_text(data, "plaintext")
    if algorithm == "aes":
        key = decode_hex(data, "key")
        nonce, ciphertext, tag = aes_encrypt(key, plaintext.encode("utf-8"))
        return jsonify(nonce=nonce.hex(), ciphertext=ciphertext.hex(), tag=tag.hex())
    if algorithm == "rsa":
        key = data.get("key")
        if not isinstance(key, dict):
            raise ValueError("'key' must contain RSA 'n' and 'e'")
        n, e = int(key["n"]), int(key["e"])
        message = int.from_bytes(plaintext.encode("utf-8"), "big")
        if message >= n:
            raise ValueError("Message is too long for this RSA modulus")
        return jsonify(ciphertext=str(pow(message, e, n)))
    if algorithm == "hill":
        key = parse_matrix(data.get("key"))
        return jsonify(ciphertext=hill_encrypt(key, plaintext))
    return jsonify(error="Unknown algorithm. Use aes, rsa or hill."), 404


@app.post("/api/<algorithm>/decrypt")
def decrypt(algorithm: str):
    data = require_json()
    ciphertext = required_text(data, "ciphertext")
    if algorithm == "aes":
        key = decode_hex(data, "key")
        nonce = decode_hex(data, "nonce")
        tag = decode_hex(data, "tag")
        encrypted = decode_hex(data, "ciphertext")
        if len(key) != 32 or len(nonce) != 12 or len(tag) != 16:
            raise ValueError("AES-256-GCM requires a 32-byte key, 12-byte nonce and 16-byte tag")
        try:
            plaintext = aes_decrypt(key, nonce, encrypted, tag).decode("utf-8")
        except (ValueError, UnicodeDecodeError) as exc:
            raise ValueError("Authentication failed or decrypted data is not valid UTF-8") from exc
        return jsonify(plaintext=plaintext)
    if algorithm == "rsa":
        key = data.get("key")
        if not isinstance(key, dict):
            raise ValueError("'key' must contain RSA 'n' and 'd'")
        n, d = int(key["n"]), int(key["d"])
        message = pow(int(ciphertext), d, n)
        length = max(1, (message.bit_length() + 7) // 8)
        try:
            plaintext = message.to_bytes(length, "big").decode("utf-8")
        except UnicodeDecodeError as exc:
            raise ValueError("Decrypted bytes are not valid UTF-8") from exc
        return jsonify(plaintext=plaintext)
    if algorithm == "hill":
        key = parse_matrix(data.get("key"))
        return jsonify(plaintext=hill_decrypt(key, ciphertext))
    return jsonify(error="Unknown algorithm. Use aes, rsa or hill."), 404


@app.errorhandler(ValueError)
@app.errorhandler(KeyError)
@app.errorhandler(TypeError)
def bad_request(error):
    return jsonify(error=str(error)), 400


@app.errorhandler(Exception)
def internal_error(error):
    app.logger.exception("Unhandled API error")
    return jsonify(error="Internal server error"), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
