from rsa.encrypt_rsa import encrypt_message

def decrypt(msg: str):
    encrypt, n, d = encrypt_message(msg.encode())

    res = pow(encrypt, int(d), int(n))
    byte_len = (res.bit_length() + 7) // 8
    decrypt = res.to_bytes(byte_len, byteorder='big').decode('utf-8')

    print("Original Text: ", msg)
    print("Encrypted Text: ", encrypt)
    print("Decrypted Text: ", decrypt)

    return decrypt