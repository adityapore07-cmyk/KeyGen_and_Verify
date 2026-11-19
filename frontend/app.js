const $ = (id) => document.getElementById(id);
const API_ENDPOINTS = {
  health: '/api/health',
  aes: { keygen: '/api/aes/keygen', encrypt: '/api/aes/encrypt', decrypt: '/api/aes/decrypt' },
  rsa: { keygen: '/api/rsa/keygen', encrypt: '/api/rsa/encrypt', decrypt: '/api/rsa/decrypt' },
  hill: { keygen: '/api/hill/keygen', encrypt: '/api/hill/encrypt', decrypt: '/api/hill/decrypt' }
};
const state = { algorithm: 'aes', mode: 'decrypt', result: '' };
const info = {
  aes: { kicker: 'SYMMETRIC ENCRYPTION', title: 'AES-256-GCM', desc: 'One shared secret key encrypts and authenticates your data.', placeholder: 'Enter ciphertext as hexadecimal.', label: 'ENCRYPTED TEXT / CIPHERTEXT' },
  rsa: { kicker: 'ASYMMETRIC ENCRYPTION', title: 'RSA', desc: 'A public key encrypts; the matching private key decrypts.', placeholder: 'Enter the RSA ciphertext integer.', label: 'ENCRYPTED TEXT / CIPHERTEXT' },
  hill: { kicker: 'CLASSICAL SUBSTITUTION', title: 'Hill Cipher', desc: 'A square key matrix transforms blocks of letters modulo 26.', placeholder: 'Enter the Hill ciphertext (letters A–Z).', label: 'CIPHERTEXT' }
};

function render() {
  const a = info[state.algorithm];
  const savedValues = {};
  ['aes-key', 'aes-nonce', 'aes-tag', 'rsa-key', 'rsa-modulus', 'hill-key'].forEach(id => {
    const input = $(id);
    if (input) savedValues[id] = input.value;
  });
  $('algo-kicker').textContent = a.kicker; $('algo-title').textContent = a.title; $('algo-desc').textContent = a.desc;
  $('payload').placeholder = state.mode === 'encrypt' ? 'Enter plaintext to encrypt.' : a.placeholder;
  $('payload-label').innerHTML = `${state.mode === 'encrypt' ? 'PLAINTEXT' : a.label} <em>INPUT</em>`;
  document.querySelectorAll('.algorithm-choice').forEach(b => b.classList.toggle('active', b.dataset.algorithm === state.algorithm));
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === state.mode));
  $('action-label').textContent = state.mode === 'decrypt' ? 'Decrypt data' : 'Encrypt data';
  $('result-title').textContent = state.mode === 'decrypt' ? 'Decrypted output' : 'Encrypted output';
  $('key-fields').innerHTML = fieldsForAlgorithm();
  Object.entries(savedValues).forEach(([id, value]) => { if ($(id)) $(id).value = value; });
  $('action-hint').textContent = 'Operations run through the local Flask API.';
  $('result-body').textContent = 'Your output will appear here after the operation is completed.';
  $('result-state').textContent = 'WAITING FOR INPUT'; $('result-state').classList.remove('success');
  $('result-footnote').textContent = 'No cryptographic operation has been performed.'; $('copy-result').disabled = true; state.result = '';
}

function fieldsForAlgorithm() {
  if (state.algorithm === 'aes') return `<label class="field full"><span class="field-label">AES SECRET KEY <em>HEX</em></span><input id="aes-key" type="password" autocomplete="off" spellcheck="false" placeholder="64 hex characters"><button type="button" class="copy-btn" data-copy="aes-key">Copy key</button><small>32 bytes · Generate a key or enter an existing one.</small></label>${state.mode === 'decrypt' ? '<label class="field"><span class="field-label">NONCE <em>HEX</em></span><input id="aes-nonce" autocomplete="off" spellcheck="false" placeholder="24 hex characters"></label><label class="field"><span class="field-label">AUTHENTICATION TAG <em>HEX</em></span><input id="aes-tag" autocomplete="off" spellcheck="false" placeholder="32 hex characters"></label>' : ''}`;
  if (state.algorithm === 'rsa') return `<label class="field full"><span class="field-label">${state.mode === 'encrypt' ? 'PUBLIC KEY' : 'PRIVATE KEY'}</span><input id="rsa-key" type="password" autocomplete="off" placeholder="${state.mode === 'encrypt' ? 'Public exponent e' : 'Private exponent d'}"><button type="button" class="copy-btn" data-copy="rsa-key">Copy ${state.mode === 'encrypt' ? 'exponent' : 'exponent'}</button><small>Supply the matching key parameter and modulus n.</small></label><label class="field full"><span class="field-label">MODULUS n</span><input id="rsa-modulus" type="password" autocomplete="off" placeholder="RSA modulus n"><button type="button" class="copy-btn" data-copy="rsa-modulus">Copy modulus</button></label>`;
  return `<label class="field full"><span class="field-label">KEY MATRIX</span><input id="hill-key" autocomplete="off" placeholder="Example: 3,3;2,5"><small>Rows separated by semicolons; values separated by commas.</small></label>`;
}

async function api(path, body) {
  const response = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
function showResult(text, success, footnote) {
  state.result = text; $('result-body').textContent = text; $('result-state').textContent = success ? 'SUCCESS' : 'ERROR';
  $('result-state').classList.toggle('success', success); $('result-footnote').textContent = footnote; $('copy-result').disabled = !success;
}
function getKey() {
  if (state.algorithm === 'aes') return $('aes-key').value.trim();
  if (state.algorithm === 'rsa') return { n: $('rsa-modulus').value.trim(), [state.mode === 'encrypt' ? 'e' : 'd']: $('rsa-key').value.trim() };
  return $('hill-key').value.trim();
}
function getPayload() { return $('payload').value.trim(); }

document.querySelectorAll('.algorithm-choice').forEach(b => b.addEventListener('click', () => { state.algorithm = b.dataset.algorithm; render(); }));
document.querySelectorAll('.mode-btn').forEach(b => b.addEventListener('click', () => { state.mode = b.dataset.mode; render(); }));
$('payload').addEventListener('input', () => $('char-count').textContent = `${$('payload').value.length.toLocaleString()} characters`);
$('clear-input').addEventListener('click', () => { $('payload').value = ''; $('char-count').textContent = '0 characters'; });
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  try {
    await navigator.clipboard.writeText($(button.dataset.copy).value);
    button.textContent = 'Copied ✓';
    setTimeout(() => { button.textContent = button.dataset.copy === 'rsa-modulus' ? 'Copy modulus' : button.dataset.copy === 'aes-key' ? 'Copy key' : 'Copy exponent'; }, 1200);
  } catch { button.textContent = 'Copy unavailable'; }
});
$('generate-key').addEventListener('click', async () => {
  try {
    const data = await api(API_ENDPOINTS[state.algorithm].keygen, {});
    if (state.algorithm === 'aes') $('aes-key').value = data.key;
    else if (state.algorithm === 'rsa') {
      $('rsa-modulus').value = data.public_key.n;
      $('rsa-key').value = state.mode === 'encrypt' ? data.public_key.e : data.private_key.d;
    } else $('hill-key').value = data.key.map(row => row.join(',')).join(';');
    showResult('Key generated. Save it securely; you will need the matching key to decrypt.', true, 'Key generation completed by the API.');
  } catch (error) { showResult(error.message, false, 'Key generation failed.'); }
});
$('load-example').addEventListener('click', () => {
  if (state.algorithm === 'aes') {
    $('aes-key').value = '0000000000000000000000000000000000000000000000000000000000000000';
    $('payload').value = state.mode === 'encrypt' ? 'Hello, AES!' : '';
    if (state.mode === 'decrypt') { $('aes-nonce').value = ''; $('aes-tag').value = ''; }
  } else if (state.algorithm === 'rsa') { $('payload').value = 'Hello'; $('rsa-key').value = ''; $('rsa-modulus').value = ''; }
  else { $('payload').value = 'HELLO'; $('hill-key').value = '3,3;2,5'; }
  $('char-count').textContent = `${$('payload').value.length} characters`;
  showResult('Example input loaded. Generate a key or enter matching key material to run the operation.', false, 'Example input loaded; no operation performed.');
});
$('run-action').addEventListener('click', async () => {
  try {
    const key = getKey();
    const payload = getPayload();
    if (!payload) throw new Error('Enter the required input first.');
    let data;
    if (state.mode === 'encrypt') {
      data = await api(API_ENDPOINTS[state.algorithm].encrypt, { plaintext: payload, key });
      if (state.algorithm === 'aes') {
        $('aes-nonce').value = data.nonce || '';
        $('aes-tag').value = data.tag || '';
        showResult(`Ciphertext (hex): ${data.ciphertext}\nNonce (hex): ${data.nonce}\nTag (hex): ${data.tag}`, true, 'AES-GCM encryption completed. Keep the key, nonce and tag with the ciphertext.');
      } else showResult(data.ciphertext, true, 'Encryption completed by the API.');
    } else {
      const body = { ciphertext: payload, key };
      if (state.algorithm === 'aes') { body.nonce = $('aes-nonce').value.trim(); body.tag = $('aes-tag').value.trim(); }
      data = await api(API_ENDPOINTS[state.algorithm].decrypt, body);
      showResult(data.plaintext, true, state.algorithm === 'aes' ? 'Authentication succeeded. Plaintext was returned only after tag verification.' : 'Decryption completed by the API.');
    }
  } catch (error) { showResult(error.message, false, 'Operation failed.'); }
});
$('copy-result').addEventListener('click', async () => { if (!$('result-body').textContent) return; try { await navigator.clipboard.writeText($('result-body').textContent); $('copy-result').textContent = 'Copied ✓'; setTimeout(() => $('copy-result').textContent = 'Copy output ↗', 1400); } catch { $('copy-result').textContent = 'Copy unavailable'; } });
api(API_ENDPOINTS.health).then(() => { $('action-hint').textContent = 'Connected to the local Flask API.'; }).catch(() => { $('action-hint').textContent = 'Start the Flask server to connect.'; });
render();
