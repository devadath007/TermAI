document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    const commandsData = [
        { title: 'System Information', code: 'uname -a || systeminfo' },
        { title: 'Check Port 8080', code: 'lsof -i :8080 || netstat -ano | findstr :8080' },
        { title: 'Clean Docker Assets', code: 'docker system prune -af' },
        { title: 'Sync Git Repository', code: 'git fetch --all && git pull' },
        { title: 'Find Large Files', code: 'find . -type f -size +100M' }
    ];

    const commandList = document.getElementById('commandList');
    const commandSearch = document.getElementById('commandSearch');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatHistory = document.getElementById('chatHistory');

    function renderCommands(cmds) {
        commandList.innerHTML = '';
        cmds.forEach(cmd => {
            const item = document.createElement('div');
            item.className = 'command-item fade-in';
            item.innerHTML = `
                <div class="cmd-title">${cmd.title} <i data-lucide="chevron-right" style="width: 14px; height: 14px; opacity: 0.5"></i></div>
                <div class="cmd-code">${cmd.code}</div>
            `;
            item.addEventListener('click', () => {
                chatInput.value = cmd.code;
                chatInput.focus();
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

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        appendMessage('user', message);
        chatInput.value = '';
        
        const aiMsgDiv = appendMessage('ai', '');
        const bubbleDiv = aiMsgDiv.querySelector('.message-bubble');
        
        // Show modern bouncing dots
        bubbleDiv.innerHTML = `
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        scrollToBottom();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (!response.ok) throw new Error('API Error');
            
            const data = await response.json();
            
            // Remove typing dots and smoothly render markdown
            bubbleDiv.innerHTML = marked.parse(data.text);
            scrollToBottom();
            
        } catch (err) {
            bubbleDiv.innerHTML = '<span style="color: #ef4444;">Connection failed. Ensure the server is running.</span>';
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
