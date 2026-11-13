from generate import generate_new_pair

def encrypt_message(text):
    key = generate_new_pair(1024)
    t = int.from_bytes(text, byteorder='big') 
    n = key[0][0]
    e = key[0][1]
    d = key[1][1]
    res = (t ** int(e)) % int(n)
    return res, n, d