document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (localStorage.getItem('termai_theme') === 'light') {
        document.body.classList.add('light-mode');
        themeToggleBtn.innerHTML = '<i data-lucide="moon"></i>';
    }
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        if (document.body.classList.contains('light-mode')) {
            localStorage.setItem('termai_theme', 'light');
            themeToggleBtn.innerHTML = '<i data-lucide="moon"></i>';
        } else {
            localStorage.setItem('termai_theme', 'dark');
            themeToggleBtn.innerHTML = '<i data-lucide="sun"></i>';
        }
        lucide.createIcons();
    });

    // Mobile Sidebar Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const appContainer = document.querySelector('.app-container');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            appContainer.classList.add('sidebar-open');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            appContainer.classList.remove('sidebar-open');
        });
    }

    // --- Recents Logic (With History) ---
    let recentChats = JSON.parse(localStorage.getItem('termai_recents')) || [];
    let currentChatId = null;
    const recentList = document.getElementById('recentList');
    const chatHistory = document.getElementById('chatHistory');
    const welcomeScreen = document.getElementById('welcomeScreen');
    let isFirstMessage = true;
    
    function renderRecents() {
        if (!recentList) return;
        recentList.innerHTML = '';
        recentChats.slice(0, 15).forEach((chat) => {
            const item = document.createElement('div');
            item.className = 'recent-item fade-in';
            item.dataset.id = chat.id;
            item.innerHTML = `
                <i data-lucide="message-square"></i>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; cursor: default;">${escapeHtml(chat.title)}</span>
            `;
            // Removed click listener so it doesn't direct to previous chat
            recentList.appendChild(item);
        });
        lucide.createIcons();
    }
    renderRecents();

    function saveCurrentChatHTML() {
        if (!currentChatId) return;
        const wrapper = document.querySelector('.messages-wrapper');
        if (!wrapper) return;
        const html = wrapper.innerHTML;
        
        const chatIndex = recentChats.findIndex(c => c.id === currentChatId);
        if (chatIndex > -1) {
            recentChats[chatIndex].html = html;
        } else {
            // Should not happen normally if addRecentChat was called
        }
        localStorage.setItem('termai_recents', JSON.stringify(recentChats));
    }

    function addRecentChat(title) {
        if (title.length > 30) title = title.substring(0, 30) + '...';
        currentChatId = 'chat_' + Date.now();
        recentChats.unshift({ id: currentChatId, title, date: new Date().toISOString(), html: '' });
        localStorage.setItem('termai_recents', JSON.stringify(recentChats));
        renderRecents();
    }

    function loadChat(id) {
        const chat = recentChats.find(c => c.id === id);
        if (!chat) return;

        currentChatId = chat.id;
        isFirstMessage = false;

        // Hide welcome screen
        if (welcomeScreen && !welcomeScreen.classList.contains('hidden')) {
            welcomeScreen.classList.add('hidden');
        }

        // Remove old wrapper
        let wrapper = document.querySelector('.messages-wrapper');
        if (wrapper) wrapper.remove();

        // Create new wrapper and load html
        wrapper = document.createElement('div');
        wrapper.className = 'messages-wrapper';
        wrapper.innerHTML = chat.html || '';
        chatHistory.appendChild(wrapper);
        lucide.createIcons();
        scrollToBottom();

        // Close sidebar on mobile
        if (appContainer.classList.contains('sidebar-open')) {
            appContainer.classList.remove('sidebar-open');
        }
    }

    document.getElementById('newChatBtn').addEventListener('click', () => {
        location.reload(); 
    });

    // --- UI Elements ---
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const submitBtn = document.getElementById('submitBtn');
    const micBtn = document.getElementById('micBtn');
    
    // Attachment Elements
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileInput');
    const attachmentPreview = document.getElementById('attachmentPreview');
    const attachmentName = document.getElementById('attachmentName');
    const removeAttachmentBtn = document.getElementById('removeAttachmentBtn');

    let currentAttachment = null;

    // Input Bar Interactions (Gemini style)
    let currentAbortController = null;
    const stopBtn = document.getElementById('stopBtn');
    
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            if (currentAbortController) {
                currentAbortController.abort();
            }
        });
    }

    chatInput.addEventListener('input', () => {
        if (currentAbortController) return; // don't toggle if generating
        if (chatInput.value.trim().length > 0 || currentAttachment) {
            submitBtn.classList.remove('hidden');
            if(micBtn) micBtn.classList.add('hidden');
        } else {
            submitBtn.classList.add('hidden');
            if(micBtn) micBtn.classList.remove('hidden');
        }
    });

    // Voice Input Logic
    if (micBtn) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            
            micBtn.addEventListener('click', () => {
                micBtn.style.color = '#ef4444'; // Red indicates listening
                recognition.start();
            });
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                chatInput.value += (chatInput.value ? ' ' : '') + transcript;
                micBtn.style.color = 'var(--text-primary)';
                chatInput.dispatchEvent(new Event('input'));
            };
            
            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                micBtn.style.color = 'var(--text-primary)';
                alert("Microphone error: " + event.error);
            };
            
            recognition.onend = () => {
                micBtn.style.color = 'var(--text-primary)';
            };
        } else {
            micBtn.addEventListener('click', () => {
                alert("Speech recognition is not supported in this browser.");
            });
        }
    }

    // Attachments Logic
    attachBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64String = event.target.result.split(',')[1];
            currentAttachment = {
                mimeType: file.type || 'text/plain',
                data: base64String
            };
            attachmentName.textContent = file.name;
            attachmentPreview.classList.remove('hidden');
            chatInput.dispatchEvent(new Event('input'));
        };
        reader.readAsDataURL(file);
    });

    removeAttachmentBtn.addEventListener('click', () => {
        currentAttachment = null;
        fileInput.value = '';
        attachmentPreview.classList.add('hidden');
        chatInput.dispatchEvent(new Event('input'));
    });

    // Markdown Renderer override
    const renderer = new marked.Renderer();
    renderer.code = function(codeOrToken, language) {
        let codeText = '';
        if (typeof codeOrToken === 'object') {
            codeText = codeOrToken.text;
        } else {
            codeText = codeOrToken;
        }
        const safeCode = escapeHtml(codeText);
        return `
            <div class="code-wrapper">
                <div class="code-toolbar">
                    <button class="code-action-btn copy-cmd-btn" data-code="${safeCode}" title="Copy to clipboard">
                        <i data-lucide="copy"></i>
                    </button>
                </div>
                <pre><code>${safeCode}</code></pre>
            </div>
        `;
    };
    if (marked.use) {
        marked.use({ renderer });
    } else {
        marked.setOptions({ renderer });
    }

    // Global listener for copy buttons
    document.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-cmd-btn');
        if (copyBtn) {
            const code = copyBtn.getAttribute('data-code');
            const unescaped = code.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
            navigator.clipboard.writeText(unescaped).then(() => {
                copyBtn.innerHTML = '<i data-lucide="check" style="color: #10b981;"></i>';
                lucide.createIcons();
                setTimeout(() => {
                    copyBtn.innerHTML = '<i data-lucide="copy"></i>';
                    lucide.createIcons();
                }, 2000);
            }).catch(console.error);
        }
    });

    // Chat Submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message && !currentAttachment) return;

        // Hide welcome screen
        if (welcomeScreen && !welcomeScreen.classList.contains('hidden')) {
            welcomeScreen.classList.add('hidden');
        }

        if (isFirstMessage) {
            const titleMsg = message || "Attachment Context";
            addRecentChat(titleMsg);
            isFirstMessage = false;
        }

        let userHtml = message ? escapeHtml(message) : '';
        if (currentAttachment) {
            if (currentAttachment.mimeType.startsWith('image/')) {
                userHtml += `${userHtml ? '<br>' : ''}<img src="data:${currentAttachment.mimeType};base64,${currentAttachment.data}" style="max-width: 100%; max-height: 300px; border-radius: 8px; margin-top: 8px;">`;
            } else {
                userHtml += `${userHtml ? '<br>' : ''}<span style="font-size: 0.85em; color: var(--text-secondary);"><i data-lucide="file" style="width:14px;height:14px;vertical-align:middle;"></i> Attachment included</span>`;
            }
        }

        appendMessage('user', userHtml, true);
        saveCurrentChatHTML();
        
        chatInput.value = '';
        chatInput.dispatchEvent(new Event('input'));
        
        const aiMsgDiv = appendMessage('ai', '');
        const bubbleDiv = aiMsgDiv.querySelector('.message-bubble');
        
        bubbleDiv.innerHTML = '<span style="color: var(--text-secondary);">🤖 Generating...</span>';
        scrollToBottom();

        const payload = { message: message || "Analyze the attached file." };
        if (currentAttachment) {
            payload.attachment = currentAttachment;
            removeAttachmentBtn.click();
        }
        
        currentAbortController = new AbortController();
        submitBtn.classList.add('hidden');
        if (stopBtn) stopBtn.classList.remove('hidden');
        if (micBtn) micBtn.classList.add('hidden');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: currentAbortController.signal
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'API Error');
            }
            
            const data = await response.json();
            
            bubbleDiv.innerHTML = marked.parse(data.text);
            lucide.createIcons(); 
            scrollToBottom();
            saveCurrentChatHTML();
            
        } catch (err) {
            if (err.name === 'AbortError') {
                bubbleDiv.innerHTML = `<span style="color: var(--text-secondary);">Generation stopped.</span>`;
                // Put the original query back into the input box so the user can edit it
                chatInput.value = message;
                chatInput.dispatchEvent(new Event('input'));
            } else {
                console.error(err);
                bubbleDiv.innerHTML = `<span style="color: #ef4444;">Error: ${err.message}</span>`;
            }
            saveCurrentChatHTML();
        } finally {
            currentAbortController = null;
            if (stopBtn) stopBtn.classList.add('hidden');
            chatInput.dispatchEvent(new Event('input'));
        }
    });

    function appendMessage(sender, textOrHtml, isHtml = false) {
        const div = document.createElement('div');
        div.className = `message ${sender}-message fade-in`;
        
        const avatarClass = sender === 'user' ? 'user-avatar' : 'ai-avatar';
        const avatarContent = sender === 'user' ? '<i data-lucide="user"></i>' : '<span style="font-size: 1.2rem;">🤖</span>';
        
        const content = isHtml ? textOrHtml : (textOrHtml ? escapeHtml(textOrHtml) : '');
        
        div.innerHTML = `
            <div class="avatar ${avatarClass}">${avatarContent}</div>
            <div class="message-bubble">${content}</div>
        `;
        
        const messagesWrapper = document.querySelector('.messages-wrapper');
        if (!messagesWrapper) {
            const wrapper = document.createElement('div');
            wrapper.className = 'messages-wrapper';
            chatHistory.appendChild(wrapper);
            wrapper.appendChild(div);
        } else {
            messagesWrapper.appendChild(div);
        }
        
        lucide.createIcons();
        scrollToBottom();
        return div;
    }

    function scrollToBottom() {
        chatHistory.scrollTo({
            top: chatHistory.scrollHeight,
            behavior: 'smooth'
        });
    }

    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});
