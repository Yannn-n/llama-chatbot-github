// API Configuration (TOKEN HERE - FOR LEARNING ONLY!)
const HF_TOKEN = "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"; // Replace with your actual token
const API_URL = "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct/";

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const typingIndicator = document.getElementById('typingIndicator');
const styleSelect = document.getElementById('styleSelect');
const lengthSelect = document.getElementById('lengthSelect');
const promptButtons = document.querySelectorAll('.prompt-btn');

// Chat History
let chatHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log("Pirate Chatbot initialized!");
    console.log("Using Hugging Face Token (visible for learning):", HF_TOKEN ? "✓ Token set" : "✗ No token");
});

// Add message to chat
function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatarIcon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
    const senderName = sender === 'user' ? 'You' : 'Pirate Bot';
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Apply speaking style
    let formattedText = text;
    if (sender === 'bot') {
        const style = styleSelect.value;
        formattedText = applyStyle(text, style);
    }
    
    messageDiv.innerHTML = `
        <div class="avatar">
            <i class="${avatarIcon}"></i>
        </div>
        <div class="message-content">
            <div class="sender">${senderName}</div>
            <div class="text">${formattedText}</div>
            <div class="timestamp">${timestamp}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Store in history
    if (sender === 'user' || sender === 'bot') {
        chatHistory.push({ sender, text });
    }
}

// Apply speaking style to bot responses
function applyStyle(text, style) {
    switch(style) {
        case 'pirate':
            return pirateStyle(text);
        case 'shakespeare':
            return shakespeareStyle(text);
        case 'valley':
            return valleyStyle(text);
        default:
            return text;
    }
}

function pirateStyle(text) {
    const piratePhrases = [
        "Arrr!",
        "Ahoy!",
        "Shiver me timbers!",
        "Yo ho ho!",
        "By the deep!",
        "Blimey!",
        "Avast!",
        "Me hearty!",
        "Aye aye!",
        "Scallywag!",
        "Swashbuckler!"
    ];
    
    const randomPhrase = piratePhrases[Math.floor(Math.random() * piratePhrases.length)];
    return `${randomPhrase} ${text}`;
}

function shakespeareStyle(text) {
    const shakespearePhrases = [
        "Verily,",
        "Forsooth,",
        "Prithee,",
        "Hark!",
        "By my troth,",
        "Alas,"
    ];
    
    const randomPhrase = shakespearePhrases[Math.floor(Math.random() * shakespearePhrases.length)];
    return `${randomPhrase} ${text.toLowerCase()}`;
}

function valleyStyle(text) {
    const valleyWords = ["like", "totally", "whatever", "OMG", "seriously", "literally"];
    const randomWord = valleyWords[Math.floor(Math.random() * valleyWords.length)];
    
    const sentences = text.split('. ');
    if (sentences.length > 0) {
        return `${sentences[0]}... ${randomWord}!`;
    }
    return text;
}

// Show/hide typing indicator
function showTyping() {
    typingIndicator.style.display = 'flex';
}

function hideTyping() {
    typingIndicator.style.display = 'none';
}

// Get system prompt based on selected style
function getSystemPrompt() {
    const style = styleSelect.value;
    
    const prompts = {
        'pirate': "You are a pirate chatbot. Always respond in pirate speak. Use pirate terms like 'arrr', 'ahoy', 'me hearty', 'yo ho ho', 'scallywag'. Keep responses under 100 words.",
        'normal': "You are a helpful AI assistant. Provide clear, concise answers.",
        'shakespeare': "You are a chatbot speaking in Shakespearean English. Use words like 'thou', 'thee', 'hark', 'forsooth', 'prithee'.",
        'valley': "You are a valley girl chatbot. Use phrases like 'like', 'totally', 'OMG', 'whatever', 'seriously'. Be super excited!"
    };
    
    return prompts[style] || prompts.normal;
}

// Call Hugging Face API
async function callHuggingFaceAPI(userMessage) {
    try {
        showTyping();
        
        const maxLength = parseInt(lengthSelect.value);
        const systemPrompt = getSystemPrompt();
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: `[INST] ${systemPrompt}

User: ${userMessage}

Assistant: [/INST]`,
                parameters: {
                    max_length: maxLength,
                    temperature: 0.7,
                    top_p: 0.9,
                    repetition_penalty: 1.1,
                    return_full_text: false
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        hideTyping();
        
        if (data && data[0] && data[0].generated_text) {
            return data[0].generated_text.trim();
        } else {
            return "Yarr! The AI be confused. Try again, matey!";
        }
        
    } catch (error) {
        hideTyping();
        console.error("API Error:", error);
        return `Arrr! There be an error: ${error.message}. Make sure ye have a valid token!`;
    }
}

// Handle user message
async function handleUserMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // Add user message
    addMessage('user', message);
    userInput.value = '';
    
    // Get AI response
    try {
        const aiResponse = await callHuggingFaceAPI(message);
        addMessage('bot', aiResponse);
    } catch (error) {
        addMessage('bot', "Shiver me timbers! The AI be not responding. Check yer token!");
    }
}

// Clear chat
function clearChat() {
    chatMessages.innerHTML = `
        <div class="message bot">
            <div class="avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="sender">Pirate Bot</div>
                <div class="text">Ahoy! Chat cleared. What be yer next question, matey?</div>
                <div class="timestamp">Just now</div>
            </div>
        </div>
    `;
    chatHistory = [];
}

// Event Listeners
sendBtn.addEventListener('click', handleUserMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserMessage();
    }
});

clearBtn.addEventListener('click', clearChat);

// Quick prompt buttons
promptButtons.forEach(button => {
    button.addEventListener('click', () => {
        const prompt = button.getAttribute('data-prompt');
        userInput.value = prompt;
        userInput.focus();
    });
});

// Enter key to send
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserMessage();
    }
});

// Demo functionality without API (if no token)
function demoMode() {
    if (!HF_TOKEN || HF_TOKEN === "hf_your_token_here") {
        console.log("Demo mode activated - using mock responses");
        
        // Override the API call function
        window.callHuggingFaceAPI = async function(userMessage) {
            showTyping();
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            hideTyping();
            
            const mockResponses = [
                "Arrr! That be a fine question, me hearty! As a pirate, I'd say the answer lies where X marks the spot!",
                "Yo ho ho! Shiver me timbers! That reminds me of the time we sailed the seven seas...",
                "Avast! Ye be asking about treasure? Aye, I've buried me share of gold doubloons!",
                "By the deep! That be a question for the ages. Let me consult me treasure map...",
                "Ahoy! As a swashbuckling pirate AI, I'd say: Aye, that be true as the North Star!",
                "Blimey! Ye caught me off guard with that one! Let me think like a true pirate...",
                "Me hearty! That be similar to when we battled the kraken! The answer be: Aye!",
                "Land ho! I see what ye be asking. From one scallywag to another, here be my answer..."
            ];
            
            const style = styleSelect.value;
            let response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
            
            return applyStyle(response, style);
        };
        
        // Show demo notice
        const demoNotice = document.createElement('div');
        demoNotice.className = 'message bot';
        demoNotice.innerHTML = `
            <div class="avatar">
                <i class="fas fa-info-circle"></i>
            </div>
            <div class="message-content">
                <div class="sender">System</div>
                <div class="text"><strong>DEMO MODE:</strong> No Hugging Face token provided. Using mock responses. To use real AI, replace HF_TOKEN in script.js with your actual token.</div>
                <div class="timestamp">System Message</div>
            </div>
        `;
        chatMessages.appendChild(demoNotice);
    }
}

// Initialize demo mode check
demoMode();

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
