// CONFIGURASI TOKEN HUGGING FACE
// File ini berisi token untuk LLaMA 3.2 Chatbot
// Token hanya akan digunakan selama sesi browser

const HF_TOKEN_CONFIG = {
    // ==============================================
    // TOKEN HUGGING FACE
    // ==============================================
    // Masukkan token Anda di sini:
    // Token bisa didapatkan dari: https://huggingface.co/settings/tokens
    // Token harus memiliki akses ke model LLaMA 3.2
    TOKEN: "", // Contoh: "hf_xxxxxxxxxxxxxxxxxxxx"
    
    // ==============================================
    // KONFIGURASI MODEL
    // ==============================================
    MODEL_ID: "meta-llama/Llama-3.2-3B-Instruct",
    
    // ==============================================
    // PENGATURAN DEFAULT
    // ==============================================
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_MAX_TOKENS: 512,
    ENABLE_STREAMING: true,
    
    // ==============================================
    // INFORMASI APLIKASI
    // ==============================================
    APP_NAME: "LLaMA 3.2 Chatbot",
    VERSION: "1.0.0",
    
    // ==============================================
    // FUNGSI VALIDASI TOKEN
    // ==============================================
    isValidToken: function(token) {
        if (!token) return false;
        if (typeof token !== 'string') return false;
        if (!token.startsWith('hf_')) return false;
        if (token.length < 10) return false;
        return true;
    },
    
    // ==============================================
    // FUNGSI UNTUK MENDAPATKAN TOKEN
    // ==============================================
    getToken: function() {
        // Cek dulu di sessionStorage
        const sessionToken = sessionStorage.getItem('hf_token');
        if (sessionToken && this.isValidToken(sessionToken)) {
            return sessionToken;
        }
        
        // Jika tidak ada di sessionStorage, gunakan token dari config
        if (this.isValidToken(this.TOKEN)) {
            // Simpan ke sessionStorage untuk sesi ini
            sessionStorage.setItem('hf_token', this.TOKEN);
            return this.TOKEN;
        }
        
        return null;
    },
    
    // ==============================================
    // FUNGSI UNTUK MENYIMPAN TOKEN BARU
    // ==============================================
    setToken: function(newToken) {
        if (this.isValidToken(newToken)) {
            // Simpan ke sessionStorage (hanya untuk sesi ini)
            sessionStorage.setItem('hf_token', newToken);
            // Juga update variabel TOKEN (tapi hanya untuk sesi ini)
            this.TOKEN = newToken;
            return true;
        }
        return false;
    },
    
    // ==============================================
    // FUNGSI UNTUK MENGHAPUS TOKEN
    // ==============================================
    clearToken: function() {
        sessionStorage.removeItem('hf_token');
        this.TOKEN = "";
        return true;
    },
    
    // ==============================================
    // FUNGSI UNTUK MEMERIKSA STATUS TOKEN
    // ==============================================
    getTokenStatus: function() {
        const token = this.getToken();
        if (!token) {
            return {
                hasToken: false,
                isValid: false,
                source: 'none',
                shortToken: 'Tidak ada token'
            };
        }
        
        return {
            hasToken: true,
            isValid: this.isValidToken(token),
            source: sessionStorage.getItem('hf_token') ? 'session' : 'config',
            shortToken: token.substring(0, 10) + '...' + token.substring(token.length - 4)
        };
    },
    
    // ==============================================
    // FUNGSI UNTUK MEMUAT TOKEN DARI FILE
    // ==============================================
    loadTokenFromFile: function(fileContent) {
        try {
            // Coba parse sebagai JSON
            const jsonData = JSON.parse(fileContent);
            if (jsonData.HF_TOKEN || jsonData.token || jsonData.TOKEN) {
                const token = jsonData.HF_TOKEN || jsonData.token || jsonData.TOKEN;
                if (this.isValidToken(token)) {
                    return this.setToken(token);
                }
            }
        } catch (e) {
            // Jika bukan JSON, coba cari token di teks
            const tokenMatch = fileContent.match(/hf_[a-zA-Z0-9]{20,}/);
            if (tokenMatch && this.isValidToken(tokenMatch[0])) {
                return this.setToken(tokenMatch[0]);
            }
            
            // Coba cari di const/let/var assignment
            const constMatch = fileContent.match(/(?:const|let|var)\s+(?:HF_TOKEN|TOKEN|token)\s*=\s*['"`](hf_[a-zA-Z0-9]{20,})['"`]/);
            if (constMatch && constMatch[1] && this.isValidToken(constMatch[1])) {
                return this.setToken(constMatch[1]);
            }
        }
        
        return false;
    }
};

// ==============================================
// CONTOH TOKEN (HAPUS SEBELUM DEPLOY)
// ==============================================
/*
// Contoh token yang valid (jangan gunakan token ini):
// HF_TOKEN_CONFIG.TOKEN = "hf_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890";

// Token yang bisa Anda dapatkan dari:
// 1. Buka https://huggingface.co/settings/tokens
// 2. Buat token baru (pilih "Write")
// 3. Pastikan akun Anda memiliki akses ke model LLaMA 3.2
// 4. Salin token dan tempel di bawah:

// UNCOMMENT BARIS DI BAWAH INI DAN MASUKKAN TOKEN ANDA:
// HF_TOKEN_CONFIG.TOKEN = "hf_xxxxxxxxxxxxxxxxxxxx";
*/

// ==============================================
// EKSPOR KONFIGURASI
// ==============================================
// Biarkan seperti ini untuk diakses oleh script.js