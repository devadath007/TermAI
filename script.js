document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // 1. Dynamic Quick Commands (localStorage)
    const defaultCommands = [
        { id: 'c1', title: 'System Information', code: 'uname -a || systeminfo' },
        { id: 'c2', title: 'Check Port 8080', code: 'lsof -i :8080 || netstat -ano | findstr :8080' },
        { id: 'c3', title: 'Clean Docker Assets', code: 'docker system prune -af' },
        { id: 'c4', title: 'Sync Git Repository', code: 'git fetch --all && git pull' },
        { id: 'c5', title: 'Find Large Files', code: 'find . -type f -size +100M' }
    ];

    let commandsData = JSON.parse(localStorage.getItem('termai_commands')) || defaultCommands;

    const commandList = document.getElementById('commandList');
    const commandSearch = document.getElementById('commandSearch');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatHistory = document.getElementById('chatHistory');
    
    // Attachment Elements
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileInput');
    const attachmentPreview = document.getElementById('attachmentPreview');
    const attachmentName = document.getElementById('attachmentName');
    const removeAttachmentBtn = document.getElementById('removeAttachmentBtn');

    let currentAttachment = null;

    function saveCommands() {
        localStorage.setItem('termai_commands', JSON.stringify(commandsData));
        renderCommands(commandsData);
    }

    function renderCommands(cmds) {
        commandList.innerHTML = '';
        cmds.forEach(cmd => {
            const item = document.createElement('div');
            item.className = 'command-item fade-in';
            item.innerHTML = `
                <div style="flex:1;">
                    <div class="cmd-title">${cmd.title}</div>
                    <div class="cmd-code">${cmd.code}</div>
                </div>
                <button class="cmd-delete-btn" data-id="${cmd.id}" title="Delete"><i data-lucide="trash-2"></i></button>
            `;
            // Click to insert code
            item.querySelector('div').addEventListener('click', () => {
                chatInput.value = cmd.code;
                chatInput.focus();
            });
            // Delete logic
            item.querySelector('.cmd-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                commandsData = commandsData.filter(c => c.id !== cmd.id);
                saveCommands();
            });
            commandList.appendChild(item);
        });
        lucide.createIcons();
    }
    renderCommands(commandsData);

    commandSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        renderCommands(commandsData.filter(c => 
            c.title.toLowerCase().includes(term) || 
            c.code.toLowerCase().includes(term)
        ));
    });

    // 2. Attachments Logic
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
        };
        reader.readAsDataURL(file);
    });

    removeAttachmentBtn.addEventListener('click', () => {
        currentAttachment = null;
        fileInput.value = '';
        attachmentPreview.classList.add('hidden');
    });

    // 3. Smart Code Blocks override
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
                    <button class="code-action-btn save-cmd-btn" data-code="${safeCode}" title="Save to Quick Commands">
                        <i data-lucide="bookmark"></i>
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

    // Global listener for copy and save buttons in chat
    document.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-cmd-btn');
        if (copyBtn) {
            const code = copyBtn.getAttribute('data-code');
            // Quick unescape for copying
            const unescaped = code.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
            navigator.clipboard.writeText(unescaped).then(() => {
                const icon = copyBtn.querySelector('i');
                const oldIcon = icon.getAttribute('data-lucide');
                icon.setAttribute('data-lucide', 'check');
                lucide.createIcons();
                setTimeout(() => {
                    icon.setAttribute('data-lucide', oldIcon);
                    lucide.createIcons();
                }, 2000);
            });
        }

        const saveBtn = e.target.closest('.save-cmd-btn');
        if (saveBtn) {
            const code = saveBtn.getAttribute('data-code');
            const unescaped = code.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
            const title = prompt("Enter a title for this Quick Command:", "New Command");
            if (title) {
                commandsData.push({
                    id: 'cmd_' + Date.now(),
                    title: title,
                    code: unescaped
                });
                saveCommands();
            }
        }
    });

    // Chat Submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message && !currentAttachment) return;

        appendMessage('user', message + (currentAttachment ? ' [Attachment included]' : ''));
        chatInput.value = '';
        
        const aiMsgDiv = appendMessage('ai', '');
        const bubbleDiv = aiMsgDiv.querySelector('.message-bubble');
        
        bubbleDiv.innerHTML = `
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        scrollToBottom();

        const payload = { message: message || "Analyze the attached file." };
        if (currentAttachment) {
            payload.attachment = currentAttachment;
            // Clear attachment UI after sending
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
            lucide.createIcons(); // Re-render icons inside new markup
            scrollToBottom();
            
        } catch (err) {
            console.error(err);
            bubbleDiv.innerHTML = `<span style="color: #ef4444;">Error: ${err.message}</span>`;
        }
    });

    function appendMessage(sender, text) {
        const div = document.createElement('div');
        div.className = `message ${sender}-message fade-in`;
        
        const avatarIcon = sender === 'user' ? 'user' : 'bot';
        const avatarClass = sender === 'user' ? 'user-avatar' : 'ai-avatar';
        
        div.innerHTML = `
            <div class="avatar ${avatarClass}"><i data-lucide="${avatarIcon}"></i></div>
            <div class="message-bubble">${text ? escapeHtml(text) : ''}</div>
        `;
        
        chatHistory.appendChild(div);
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
