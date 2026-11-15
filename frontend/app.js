const $ = (id) => document.getElementById(id);
const state = { algorithm: 'aes', mode: 'decrypt', result: '' };
const info = {
  aes: { kicker: 'SYMMETRIC ENCRYPTION', title: 'AES-256-GCM', desc: 'One shared secret key encrypts and authenticates your data.', placeholder: 'Paste AES-GCM ciphertext as hexadecimal. The nonce and authentication tag are entered above.', label: 'ENCRYPTED TEXT / CIPHERTEXT' },
  rsa: { kicker: 'ASYMMETRIC ENCRYPTION', title: 'RSA', desc: 'A public key encrypts; the matching private key decrypts.', placeholder: 'Paste the RSA ciphertext integer here. The supplied Python example currently demonstrates a local round-trip, not a web API.', label: 'ENCRYPTED TEXT / CIPHERTEXT' },
  hill: { kicker: 'CLASSICAL SUBSTITUTION', title: 'Hill Cipher', desc: 'A square key matrix transforms blocks of letters modulo 26.', placeholder: 'Paste the Hill cipher text here (letters A–Z).', label: 'CIPHERTEXT' }
};
function render() {
  const a = info[state.algorithm];
  $('algo-kicker').textContent = a.kicker; $('algo-title').textContent = a.title; $('algo-desc').textContent = a.desc;
  $('payload').placeholder = a.placeholder; $('payload-label').innerHTML = `${a.label} <em>INPUT</em>`;
  document.querySelectorAll('.algorithm-choice').forEach(b => b.classList.toggle('active', b.dataset.algorithm === state.algorithm));
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === state.mode));
  $('action-label').textContent = state.mode === 'decrypt' ? 'Decrypt data' : 'Encrypt data';
  $('result-title').textContent = state.mode === 'decrypt' ? 'Decrypted output' : 'Encrypted output';
  $('key-fields').innerHTML = fieldsForAlgorithm();
  $('action-hint').textContent = state.algorithm === 'aes' ? 'AES-GCM can run locally in this browser.' : 'Python backend integration required.';
  $('result-body').textContent = 'Your output will appear here after the operation is completed.';
  $('result-state').textContent = 'WAITING FOR INPUT'; $('result-state').classList.remove('success');
  $('result-footnote').textContent = 'No cryptographic operation has been performed.'; $('copy-result').disabled = true; state.result = '';
}
function fieldsForAlgorithm() {
  if (state.algorithm === 'aes') return `<label class="field full"><span class="field-label">AES SECRET KEY <em>HEX</em></span><input id="aes-key" type="password" autocomplete="off" spellcheck="false" placeholder="64 hex characters for AES-256"><small>32 bytes · Use the exact key that was used for encryption.</small></label><label class="field"><span class="field-label">NONCE <em>HEX</em></span><input id="aes-nonce" autocomplete="off" spellcheck="false" placeholder="24 hex characters"></label><label class="field"><span class="field-label">AUTHENTICATION TAG <em>HEX</em></span><input id="aes-tag" autocomplete="off" spellcheck="false" placeholder="32 hex characters"></label>`;
  if (state.algorithm === 'rsa') return `<label class="field full"><span class="field-label">RSA KEY PARAMETERS</span><input id="rsa-key" type="password" autocomplete="off" placeholder="Private exponent d (decrypt) or public exponent e (encrypt)"><small>Key modulus n is also required. This preview does not send keys to a server.</small></label><label class="field full"><span class="field-label">MODULUS n</span><input id="rsa-modulus" type="password" autocomplete="off" placeholder="RSA modulus n"></label>`;
  return `<label class="field full"><span class="field-label">KEY MATRIX</span><input id="hill-key" autocomplete="off" placeholder="Example: 3,3;2,5"><small>Rows separated by semicolons; values separated by commas. Matrix must be invertible modulo 26.</small></label>`;
}
function hexToBytes(value, label) {
  const clean = value.trim().replace(/^0x/i, '').replace(/\s+/g, '');
  if (!clean || clean.length % 2 || !/^[0-9a-f]+$/i.test(clean)) throw new Error(`${label} must be valid hexadecimal with an even number of characters.`);
  return Uint8Array.from(clean.match(/../g), b => parseInt(b, 16));
}
function bytesToHex(bytes) { return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''); }
async function aesDecrypt() {
  const key = hexToBytes($('aes-key').value, 'AES key');
  const nonce = hexToBytes($('aes-nonce').value, 'Nonce');
  const tag = hexToBytes($('aes-tag').value, 'Authentication tag');
  const cipher = hexToBytes($('payload').value, 'Ciphertext');
  if (![16,24,32].includes(key.length)) throw new Error('AES key must be 16, 24 or 32 bytes. For AES-256, use 32 bytes.');
  if (nonce.length !== 12) throw new Error('This project uses a 12-byte (96-bit) GCM nonce.');
  if (tag.length !== 16) throw new Error('This project uses a 16-byte (128-bit) GCM authentication tag.');
  const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
  const combined = new Uint8Array(cipher.length + tag.length); combined.set(cipher); combined.set(tag, cipher.length);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, cryptoKey, combined);
  return new TextDecoder('utf-8', { fatal: true }).decode(plain);
}
function showResult(text, success, footnote) {
  state.result = text; $('result-body').textContent = text; $('result-state').textContent = success ? 'VERIFIED' : 'NEEDS BACKEND';
  $('result-state').classList.toggle('success', success); $('result-footnote').textContent = footnote; $('copy-result').disabled = !success;
}
document.querySelectorAll('.algorithm-choice').forEach(b => b.addEventListener('click', () => { state.algorithm = b.dataset.algorithm; render(); }));
document.querySelectorAll('.mode-btn').forEach(b => b.addEventListener('click', () => { state.mode = b.dataset.mode; render(); }));
$('payload').addEventListener('input', () => $('char-count').textContent = `${$('payload').value.length.toLocaleString()} characters`);
$('clear-input').addEventListener('click', () => { $('payload').value = ''; $('char-count').textContent = '0 characters'; });
$('load-example').addEventListener('click', () => {
  if (state.algorithm === 'aes') {
    $('payload').value = '000000000000000000000000'; $('aes-key').value = '0000000000000000000000000000000000000000000000000000000000000000'; $('aes-nonce').value = '000000000000000000000000'; $('aes-tag').value = '00000000000000000000000000000000';
  } else if (state.algorithm === 'rsa') { $('payload').value = '123456789'; $('rsa-key').value = ''; $('rsa-modulus').value = ''; }
  else { $('payload').value = 'GDD'; $('hill-key').value = '3,3;2,5'; }
  $('char-count').textContent = `${$('payload').value.length} characters`; showResult('Example loaded. This is sample input only; it is not a valid encrypted message for your own key.', false, 'Example data loaded; no operation performed.');
});
$('run-action').addEventListener('click', async () => {
  const payload = $('payload').value.trim();
  if (!payload) { showResult('Enter the required input first.', false, 'Missing input.'); return; }
  if (state.algorithm === 'aes' && state.mode === 'decrypt') {
    try { const plain = await aesDecrypt(); showResult(plain, true, 'AES-GCM authentication succeeded. Plaintext was released only after tag verification.'); }
    catch (e) { showResult(`Decryption failed: ${e.message}${e.name === 'OperationError' ? ' The key, nonce, ciphertext or tag may be incorrect or the data may have been tampered with.' : ''}`, false, 'No plaintext was released.'); }
    return;
  }
  const msg = state.algorithm === 'aes' ? 'AES encryption is not enabled in this preview. The Python project can perform it with generate_aes.py and encrypt_aes.py.' : state.algorithm === 'rsa' ? 'RSA operations need a backend adapter. The supplied Python RSA example generates a fresh key pair inside encrypt_message(), so it cannot decrypt arbitrary pasted ciphertext with a separately supplied key as this UI stands.' : 'Hill cipher operations need a backend adapter. The Python functions require the matching invertible key matrix and apply letter cleaning/padding rules.';
  showResult(msg, false, 'No cryptographic operation was performed.');
});
$('copy-result').addEventListener('click', async () => { if (!state.result) return; try { await navigator.clipboard.writeText(state.result); $('copy-result').textContent = 'Copied ✓'; setTimeout(() => $('copy-result').textContent = 'Copy output ↗', 1400); } catch { $('copy-result').textContent = 'Copy unavailable'; } });
render();
