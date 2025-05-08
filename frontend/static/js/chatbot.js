class Chatbot {
    constructor() {
      this.config = this.getConfig();
      if (!this.config) return;
  
      this.elements = this.getElements();
      if (!this.elements) return;
  
      this.init();
      console.log("Chatbot inicializado com sucesso");
    }
  
    getConfig() {
      const configElement = document.getElementById("chat-config");
      if (!configElement) {
        console.error("Configuração do chatbot não encontrada");
        return null;
      }
  
      return {
        apiUrl: configElement.dataset.apiUrl,
        csrfToken: configElement.dataset.csrfToken,
      };
    }
  
    getElements() {
      const elements = {
        button: document.getElementById("chatbot-button"),
        modal: document.getElementById("chatbot-modal"),
        close: document.getElementById("chatbot-close"),
        send: document.getElementById("chatbot-send"),
        input: document.getElementById("chatbot-input"),
        messages: document.getElementById("chatbot-messages"),
      };
  
      for (const [key, element] of Object.entries(elements)) {
        if (!element) {
          console.warn(`Elemento não encontrado: ${key}`);
        }
      }
  
      return elements;
    }
  
    init() {
      this.setupEventListeners();
    }
  
    setupEventListeners() {
      this.elements.button?.addEventListener("click", () => this.toggleChat());
      this.elements.close?.addEventListener("click", () => this.closeChat());
      this.elements.send?.addEventListener("click", () => this.sendMessage());
      this.elements.input?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.sendMessage();
      });

      this.elements.modal?.addEventListener('animationend', () => {
        if (this.elements.modal?.classList.contains('closing')) {
          this.elements.modal.classList.add('hidden');
          this.elements.modal.classList.remove('closing');
        }
      });
    }

    toggleChat() {
      if (this.elements.modal?.classList.contains('hidden')) {
        this.openChat();
      } else {
        this.closeChat();
      }
    }
  
    openChat() {
      this.elements.modal?.classList.remove('hidden');
      void this.elements.modal?.offsetWidth;
      this.elements.modal?.classList.add('open');
      this.elements.input?.focus();
    }
      
    closeChat() {
      this.elements.modal?.classList.remove('open');
      void this.elements.modal?.offsetWidth;
      this.elements.modal?.classList.add('closing');
    }
  
    async sendMessage() {
      if (!this.elements.input) return;
      
      const message = this.elements.input.value.trim();
      if (!message) return;
  
      this.addMessage(message, "user");
      this.elements.input.value = "";
  
      const typingIndicator = this.showTypingIndicator();
  
      try {
        const response = await this.fetchBotResponse(message);
        this.handleBotResponse(response, typingIndicator);
      } catch (error) {
        this.handleError(error, typingIndicator);
      }
    }
  
    addMessage(text, sender) {
      if (!this.elements.messages) return;
      
      const messageContainer = document.createElement("div");
      messageContainer.className = "message-container message-animate";
      
      const senderName = document.createElement("div");
      senderName.className = sender === "user" ? "sender-name user-name" : "sender-name bot-name";
      senderName.textContent = sender === "user" ? "Você" : "CapitAI";
      
      const messageContent = document.createElement("div");
      messageContent.className = sender === "user" ? "p-3 user-message" : "p-3 bot-message";
      messageContent.textContent = text;
      
      messageContainer.appendChild(senderName);
      messageContainer.appendChild(messageContent);
      this.elements.messages.appendChild(messageContainer);
      
      this.scrollToBottom();
    }
  
    showTypingIndicator() {
      if (!this.elements.messages) return null;
      
      const typing = document.createElement("div");
      typing.className = "bg-gray-100 p-2 rounded-lg max-w-[80%] mb-2";
      typing.innerHTML = '<i class="fas fa-ellipsis-h"></i>';
      this.elements.messages.appendChild(typing);
      this.scrollToBottom();
      return typing;
    }
  
    scrollToBottom() {
      if (this.elements.messages) {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
      }
    }
  
    async fetchBotResponse(message) {
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": this.config.csrfToken,
        },
        body: JSON.stringify({ message }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      return await response.json();
    }
  
    handleBotResponse(response, typingIndicator) {
      this.removeTypingIndicator(typingIndicator);
  
      if (response?.response) {
        this.addMessage(response.response, "bot");
      } else {
        this.addMessage("Não entendi sua pergunta. Poderia reformular?", "bot");
      }
    }
  
    handleError(error, typingIndicator) {
      console.error("Erro no chatbot:", error);
      this.removeTypingIndicator(typingIndicator);
      this.addMessage(
        "Desculpe, estou com problemas técnicos. Tente novamente mais tarde.",
        "bot"
      );
    }
  
    removeTypingIndicator(typingIndicator) {
      if (typingIndicator?.parentNode) {
        typingIndicator.parentNode.removeChild(typingIndicator);
      }
    }
}
  
document.addEventListener("DOMContentLoaded", () => {
    new Chatbot();
});