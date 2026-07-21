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

    // --- Recents Logic ---
    let recentChats = JSON.parse(localStorage.getItem('termai_recents')) || [];
    const recentList = document.getElementById('recentList');
    
    function renderRecents() {
        if (!recentList) return;
        recentList.innerHTML = '';
        recentChats.slice(0, 15).forEach((chat) => {
            const item = document.createElement('div');
            item.className = 'recent-item fade-in';
            item.innerHTML = `
                <i data-lucide="message-square"></i>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">${escapeHtml(chat.title)}</span>
            `;
            recentList.appendChild(item);
        });
        lucide.createIcons();
    }
    renderRecents();

    function addRecentChat(title) {
        if (title.length > 30) title = title.substring(0, 30) + '...';
        // Avoid duplicates at the top
        if (recentChats.length > 0 && recentChats[0].title === title) return;
        recentChats.unshift({ title, date: new Date().toISOString() });
        localStorage.setItem('termai_recents', JSON.stringify(recentChats));
        renderRecents();
    }

    document.getElementById('newChatBtn').addEventListener('click', () => {
        location.reload(); // Simple way to reset for now
    });

    // --- UI Elements ---
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatHistory = document.getElementById('chatHistory');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const submitBtn = document.getElementById('submitBtn');
    const micBtn = document.getElementById('micBtn');
    
    // Attachment Elements
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileInput');
    const attachmentPreview = document.getElementById('attachmentPreview');
    const attachmentName = document.getElementById('attachmentName');
    const removeAttachmentBtn = document.getElementById('removeAttachmentBtn');

    let currentAttachment = null;
    let isFirstMessage = true;

    // Input Bar Interactions (Gemini style)
    chatInput.addEventListener('input', () => {
        if (chatInput.value.trim().length > 0) {
            submitBtn.classList.remove('hidden');
            if(micBtn) micBtn.classList.add('hidden');
        } else {
            submitBtn.classList.add('hidden');
            if(micBtn) micBtn.classList.remove('hidden');
        }
    });

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
            submitBtn.classList.remove('hidden');
            if(micBtn) micBtn.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    });

    removeAttachmentBtn.addEventListener('click', () => {
        currentAttachment = null;
        fileInput.value = '';
        attachmentPreview.classList.add('hidden');
        if (chatInput.value.trim().length === 0) {
            submitBtn.classList.add('hidden');
            if(micBtn) micBtn.classList.remove('hidden');
        }
    });

    // Markdown Renderer override (Remove Save to Quick Commands)
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

        if (isFirstMessage && message) {
            addRecentChat(message);
            isFirstMessage = false;
        }

        appendMessage('user', message + (currentAttachment ? ' [Attachment included]' : ''));
        chatInput.value = '';
        submitBtn.classList.add('hidden');
        if(micBtn) micBtn.classList.remove('hidden');
        
        const aiMsgDiv = appendMessage('ai', '');
        const bubbleDiv = aiMsgDiv.querySelector('.message-bubble');
        
        // Typing indicator like Gemini (shimmer)
        bubbleDiv.innerHTML = '<span style="color: var(--text-secondary);">Generating...</span>';
        scrollToBottom();

        const payload = { message: message || "Analyze the attached file." };
        if (currentAttachment) {
            payload.attachment = currentAttachment;
            removeAttachmentBtn.click();
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'API Error');
            }
            
            const data = await response.json();
            
            bubbleDiv.innerHTML = marked.parse(data.text);
            lucide.createIcons(); 
            scrollToBottom();
            
        } catch (err) {
            console.error(err);
            bubbleDiv.innerHTML = `<span style="color: #ef4444;">Error: ${err.message}</span>`;
        }
    });

    function appendMessage(sender, text) {
        const div = document.createElement('div');
        div.className = `message ${sender}-message fade-in`;
        
        const avatarIcon = sender === 'user' ? 'user' : 'sparkles';
        const avatarClass = sender === 'user' ? 'user-avatar' : 'ai-avatar';
        
        div.innerHTML = `
            <div class="avatar ${avatarClass}"><i data-lucide="${avatarIcon}"></i></div>
            <div class="message-bubble">${text ? escapeHtml(text) : ''}</div>
        `;
        
        const messagesWrapper = document.querySelector('.messages-wrapper');
        if (!messagesWrapper) {
            // Create wrapper if it doesn't exist
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
