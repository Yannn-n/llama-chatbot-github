// LLaMA 3.2 Chatbot - Script Utama
// Token disimpan hanya di sessionStorage (hanya untuk sesi ini)

// State aplikasi
let chatState = {
    messages: [],
    isGenerating: false,
    abortController: null,
    sessionStart: new Date(),
    tokenSource: 'none'
};

// DOM Elements
const elements = {
    tokenConfig: document.getElementById('tokenConfig'),
    chatInterface: document.getElementById('chatInterface'),
    manualToken: document.getElementById('manualToken'),
    saveManualBtn: document.getElementById('saveManualBtn'),
    tokenFile: document.getElementById('tokenFile'),
    useDirectTokenBtn: document.getElementById('useDirectTokenBtn'),
    tokenInfo: document.getElementById('tokenInfo'),
    tokenShort: document.getElementById('tokenShort'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    stopBtn: document.getElementById('stopBtn'),
    chatMessages: document.getElementById('chatMessages'),
    messageCount: document.getElementById('messageCount'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    exportChatBtn: document.getElementById('exportChatBtn'),
    refreshTokenBtn: document.getElementById('refreshTokenBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),
    tokenModal: document.getElementById('tokenModal'),
    currentToken: document.getElementById('currentToken'),
    copyTokenBtn: document.getElementById('copyTokenBtn'),
    clearTokenBtn: document.getElementById('clearTokenBtn'),
    closeModalBtn: document.getElementById('closeModalBtn')
};

// Inisialisasi aplikasi
function initApp() {
    // Cek status token
    const tokenStatus = HF_TOKEN_CONFIG.getTokenStatus();
    chatState.tokenSource = tokenStatus.source;
    
    if (tokenStatus.hasToken && tokenStatus.isValid) {
        showChatInterface();
        updateTokenDisplay(tokenStatus);
        loadChatHistory();
    } else {
        showTokenConfig();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Update direct token preview
    updateDirectTokenPreview();
    
    // Auto-resize textarea
    setupAutoResize();
    
    console.log('LLaMA 3.2 Chatbot initialized');
}

// Tampilkan konfigurasi token
function showTokenConfig() {
    elements.tokenConfig.style.display = 'block';
    elements.chatInterface.style.display = 'none';
}

// Tampilkan chat interface
function showChatInterface() {
    elements.tokenConfig.style.display = 'none';
    elements.chatInterface.style.display = 'flex';
    elements.messageInput.focus();
}

// Update tampilan token
function updateTokenDisplay(tokenStatus) {
    if (tokenStatus.hasToken && tokenStatus.isValid) {
        elements.tokenInfo.textContent = `Token: ${tokenStatus.shortToken}`;
        elements.tokenShort.textContent = tokenStatus.shortToken;
        
        // Update session info
        const sessionInfo = document.getElementById('sessionInfo');
        const now = new Date();
        const diff = Math.floor((now - chatState.sessionStart) / 1000 / 60); // dalam menit
        sessionInfo.innerHTML = `<i class="fas fa-clock"></i> Sesi: ${diff} menit`;
    } else {
        elements.tokenInfo.textContent = 'Token: Tidak Aktif';
        elements.tokenShort.textContent = 'Tidak aktif';
    }
}

// Setup semua event listeners
function setupEventListeners() {
    // Token manual
    elements.saveManualBtn.addEventListener('click', saveManualToken);
    elements.manualToken.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveManualToken();
    });
    
    // File upload
    elements.tokenFile.addEventListener('change', handleFileUpload);
    
    // Token langsung dari config
    elements.useDirectTokenBtn.addEventListener('click', useDirectToken);
    
    // Chat controls
    elements.messageInput.addEventListener('input', handleInputChange);
    elements.messageInput.addEventListener('keydown', handleKeyDown);
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.stopBtn.addEventListener('click', stopGeneration);
    elements.clearChatBtn.addEventListener('click', clearChat);
    elements.exportChatBtn.addEventListener('click', exportChat);
    elements.refreshTokenBtn.addEventListener('click', refreshToken);
    
    // Token modal
    elements.copyTokenBtn.addEventListener('click', copyToken);
    elements.clearTokenBtn.addEventListener('click', clearToken);
    elements.closeModalBtn.addEventListener('click', () => {
        elements.tokenModal.style.display = 'none';
    });
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === elements.tokenModal) {
            elements.tokenModal.style.display = 'none';
        }
    });
    
    // Update sliders
    document.getElementById('temperature').addEventListener('input', updateSliderValue);
    document.getElementById('maxTokens').addEventListener('input', updateSliderValue);
}

// Simpan token manual
function saveManualToken() {
    const token = elements.manualToken.value.trim();
    
    if (!token) {
        showNotification('Masukkan token Hugging Face', 'error');
        return;
    }
    
    if (!token.startsWith('hf_')) {
        showNotification('Token harus dimulai dengan "hf_"', 'error');
        return;
    }
    
    if (HF_TOKEN_CONFIG.setToken(token)) {
        showNotification('Token berhasil disimpan untuk sesi ini!', 'success');
        elements.manualToken.value = '';
        
        const tokenStatus = HF_TOKEN_CONFIG.getTokenStatus();
        updateTokenDisplay(tokenStatus);
        showChatInterface();
        
        // Simpan ke session history
        saveToSessionHistory('manual');
    } else {
        showNotification('Token tidak valid', 'error');
    }
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileName = document.getElementById('fileName');
    fileName.textContent = file.name;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        
        if (HF_TOKEN_CONFIG.loadTokenFromFile(content)) {
            showNotification('Token berhasil diimpor dari file!', 'success');
            
            const tokenStatus = HF_TOKEN_CONFIG.getTokenStatus();
            updateTokenDisplay(tokenStatus);
            showChatInterface();
            
            // Reset file input
            elements.tokenFile.value = '';
            fileName.textContent = 'Belum ada file dipilih';
            
            // Simpan ke session history
            saveToSessionHistory('file');
        } else {
            showNotification('Tidak dapat menemukan token yang valid di file', 'error');
        }
    };
    
    reader.readAsText(file);
}

// Gunakan token langsung dari config
function useDirectToken() {
    if (HF_TOKEN_CONFIG.isValidToken(HF_TOKEN_CONFIG.TOKEN)) {
        if (HF_TOKEN_CONFIG.setToken(HF_TOKEN_CONFIG.TOKEN)) {
            showNotification('Token dari config.js berhasil digunakan!', 'success');
            
            const tokenStatus = HF_TOKEN_CONFIG.getTokenStatus();
            updateTokenDisplay(tokenStatus);
            showChatInterface();
            
            // Simpan ke session history
            saveToSessionHistory('config');
        }
    } else {
        showNotification('Token di config.js tidak valid atau kosong', 'error');
    }
}

// Update preview token langsung
function updateDirectTokenPreview() {
    const preview = document.getElementById('directTokenPreview');
    if (HF_TOKEN_CONFIG.TOKEN) {
        const maskedToken = HF_TOKEN_CONFIG.TOKEN.substring(0, 10) + '...' + 
                           HF_TOKEN_CONFIG.TOKEN.substring(HF_TOKEN_CONFIG.TOKEN.length - 4);
        preview.textContent = `const HF_TOKEN = "${maskedToken}";`;
    } else {
        preview.textContent = '// Token belum diatur di config.js';
    }
}

// Handle input change
function handleInputChange() {
    const hasText = elements.messageInput.value.trim().length > 0;
    elements.sendBtn.disabled = !hasText || chatState.isGenerating;
}

// Handle keyboard shortcuts
function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (elements.messageInput.value.trim() && !chatState.isGenerating) {
            sendMessage();
        }
    }
}

// Setup auto-resize textarea
function setupAutoResize() {
    elements.messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}

// Kirim pesan
async function sendMessage() {
    const message = elements.messageInput.value.trim();
    if (!message || chatState.isGenerating) return;
    
    // Cek token
    const tokenStatus = HF_TOKEN_CONFIG.getTokenStatus();
    if (!tokenStatus.hasToken || !tokenStatus.isValid) {
        showNotification('Token tidak valid. Silakan konfigurasi ulang.', 'error');
        showTokenConfig();
        return;
    }
    
    // Tambah pesan user ke state
    addMessageToState('user', message);
    
    // Tampilkan pesan user
    displayMessage(message, 'user');
    
    // Reset input
    elements.messageInput.value = '';
    elements.messageInput.style.height = 'auto';
    handleInputChange();
    
    // Tampilkan loading
    showLoading(true, 'Mengirim ke LLaMA 3.2...');
    
    // Setup abort controller untuk stop generation
    chatState.abortController = new AbortController();
    chatState.isGenerating = true;
    elements.stopBtn.disabled = false;
    
    try {
        const temperature = parseFloat(document.getElementById('temperature').value);
        const maxTokens = parseInt(document.getElementById('maxTokens').value);
        const enableStreaming = document.getElementById('streamingToggle').checked;
        
        if (enableStreaming) {
            await streamResponse(message, temperature, maxTokens);
        } else {
            await getFullResponse(message, temperature, maxTokens);
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            addMessageToState('system', 'Generasi dihentikan oleh pengguna');
            displayMessage('Generasi dihentikan', 'system');
        } else {
            console.error('Error:', error);
            const errorMsg = error.message || 'Terjadi kesalahan';
            addMessageToState('assistant', `Error: ${errorMsg}`);
            displayMessage(`Error: ${errorMsg}`, 'assistant', true);
        }
    } finally {
        // Reset state
        chatState.isGenerating = false;
        chatState.abortController = null;
        elements.stopBtn.disabled = true;
        showLoading(false);
        
        // Scroll ke bawah
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
}

// Dapatkan response streaming
async function streamResponse(message, temperature, maxTokens) {
    const token = HF_TOKEN_CONFIG.getToken();
    const prompt = formatPrompt(message);
    
    const response = await fetch(
        `https://api-inference.huggingface.co/models/${HF_TOKEN_CONFIG.MODEL_ID}`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: maxTokens,
                    temperature: temperature,
                    top_p: 0.95,
                    repetition_penalty: 1.1,
                    do_sample: true,
                    return_full_text: false,
                    stop: ["<|eot_id|>", "<|end_of_text|>", "</s>"]
                },
                options: {
                    wait_for_model: true
                }
            }),
            signal: chatState.abortController.signal
        }
    );
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    let assistantMessage = '';
    
    if (Array.isArray(data) && data[0]?.generated_text) {
        assistantMessage = data[0].generated_text;
    } else if (data.generated_text) {
        assistantMessage = data.generated_text;
    } else {
        assistantMessage = 'Tidak mendapatkan respons yang valid.';
    }
    
    // Clean up response
    assistantMessage = cleanResponse(assistantMessage);
    
    // Add to state and display
    addMessageToState('assistant', assistantMessage);
    displayMessage(assistantMessage, 'assistant');
}

// Dapatkan response penuh (non-streaming)
async function getFullResponse(message, temperature, maxTokens) {
    // Sama seperti streamResponse untuk sekarang
    // (Hugging Face API tidak mendukung streaming untuk semua model)
    await streamResponse(message, temperature, maxTokens);
}

// Format prompt untuk LLaMA 3.2
function formatPrompt(message) {
    const history = chatState.messages.slice(-5); // Ambil 5 pesan terakhir
    let prompt = "<|begin_of_text|>";
    
    // Add system message
    prompt += `<|start_header_id|>system<|end_header_id|>\n\n`;
    prompt += `Anda adalah asisten AI LLaMA 3.2 yang membantu. Berikan respons yang jelas dan informatif.\n<|eot_id|>`;
    
    // Add history
    history.forEach(msg => {
        if (msg.role === 'user') {
            prompt += `<|start_header_id|>user<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
        } else if (msg.role === 'assistant') {
            prompt += `<|start_header_id|>assistant<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
        }
    });
    
    // Add current message
    prompt += `<|start_header_id|>user<|end_header_id|>\n\n${message}<|eot_id|>`;
    prompt += `<|start_header_id|>assistant<|end_header_id|>\n\n`;
    
    return prompt;
}

// Clean response text
function cleanResponse(text) {
    return text
        .replace(/<\|eot_id\|>/g, '')
        .replace(/<\|end_of_text\|>/g, '')
        .replace(/<\/s>/g, '')
        .replace(/<\|[^>]+\|>/g, '')
        .trim();
}

// Stop generation
function stopGeneration() {
    if (chatState.abortController && chatState.isGenerating) {
        chatState.abortController.abort();
        chatState.isGenerating = false;
        elements.stopBtn.disabled = true;
        showLoading(false);
    }
}

// Clear chat
function clearChat() {
    if (chatState.isGenerating) {
        showNotification('Tunggu hingga generasi selesai', 'warning');
        return;
    }
    
    if (confirm('Hapus semua percakapan?')) {
        chatState.messages = [];
        elements.chatMessages.innerHTML = `
            <div class="message system-message">
                <div class="message-content">
                    <div class="message-text">
                        <strong>Sistem:</strong> Percakapan telah dihapus. Token masih aktif.
                    </div>
                </div>
            </div>
        `;
        updateMessageCount();
        saveChatHistory();
    }
}

// Export chat
function exportChat() {
    if (chatState.messages.length === 0) {
        showNotification('Tidak ada percakapan untuk diexport', 'warning');
        return;
    }
    
    const chatData = {
        app: 'LLaMA 3.2 Chatbot',
        timestamp: new Date().toISOString(),
        tokenSource: chatState.tokenSource,
        messages: chatState.messages
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `llama-chat-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Percakapan berhasil diexport', 'success');
}

// Refresh token
function refreshToken() {
    // Show current token in modal
    const token = HF_TOKEN_CONFIG.getToken();
    if (token) {
        elements.currentToken.textContent = token;
        elements.tokenModal.style.display = 'flex';
    } else {
        showNotification('Tidak ada token aktif', 'warning');
        showTokenConfig();
    }
}

// Copy token to clipboard
async function copyToken() {
    const token = HF_TOKEN_CONFIG.getToken();
    if (token) {
        try {
            await navigator.clipboard.writeText(token);
            showNotification('Token disalin ke clipboard', 'success');
        } catch (err) {
            showNotification('Gagal menyalin token', 'error');
        }
    }
}

// Clear token
function clearToken() {
    if (confirm('Hapus token? Ini akan mengakhiri sesi.')) {
        HF_TOKEN_CONFIG.clearToken();
        elements.tokenModal.style.display = 'none';
        showNotification('Token dihapus', 'success');
        showTokenConfig();
        updateTokenDisplay(HF_TOKEN_CONFIG.getTokenStatus());
        
        // Clear chat
        chatState.messages = [];
        elements.chatMessages.innerHTML = `
            <div class="message system-message">
                <div class="message-content">
                    <div class="message-text">
                        <strong>Sistem:</strong> Token telah dihapus. Sesi berakhir.
                    </div>
                </div>
            </div>
        `;
        updateMessageCount();
    }
}

// Add message to state
function addMessageToState(role, content) {
    chatState.messages.push({
        role: role,
        content: content,
        timestamp: new Date().toISOString()
    });
    updateMessageCount();
    saveChatHistory();
}

// Display message in chat
function displayMessage(content, role, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const timestamp = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    let avatar = '🤖';
    let sender = 'LLaMA 3.2';
    
    if (role === 'user') {
        avatar = '👤';
        sender = 'Anda';
    } else if (role === 'system') {
        avatar = '⚙️';
        sender = 'Sistem';
    }
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-text" ${isError ? 'style="color: #EF4444;"' : ''}>
                ${content.replace(/\n/g, '<br>')}
            </div>
            <div class="message-meta">
                <span>${sender}</span>
                <span>${timestamp}</span>
            </div>
        </div>
    `;
    
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Update message count
function updateMessageCount() {
    const userMessages = chatState.messages.filter(m => m.role === 'user').length;
    elements.messageCount.textContent = userMessages;
}

// Show/hide loading
function showLoading(show, text = 'Memproses...') {
    if (show) {
        elements.loadingText.textContent = text;
        elements.loadingOverlay.style.display = 'flex';
    } else {
        elements.loadingOverlay.style.display = 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${colors[type] || colors.info};
        color: white;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
 