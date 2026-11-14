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


if __name__ == "__main__":
    from encrypt_aes import encrypt
    from generate_aes import generate_key

    key = generate_key()

    nonce, ciphertext, tag = encrypt(key, b"Hello, AES!")
    print("Ciphertext (hex):", ciphertext.hex())
    print("Decrypted text  :", decrypt(key, nonce, ciphertext, tag).decode())

    # Flip every bit of the ciphertext's first byte to simulate tampering
    bad_ciphertext = bytearray(ciphertext)
    bad_ciphertext[0] ^= 0xFF

    try:
        decrypt(key, nonce, bytes(bad_ciphertext), tag)
    except ValueError as err:
        print("Tampering detected! Decryption failed:", err)
