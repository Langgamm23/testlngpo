/* =========================================================================*
   AGORA — AI Chat Module
   Handles Gemini AI integration, conversation context, and message formatting.
   ========================================================================= */

class AgoraAIChat {
  constructor(config = {}) {
    // NOTE: this key is visible to anyone who opens dev tools on this page.
    // Fine for a local demo — for a real deployment, move Gemini calls behind
    // a small backend/serverless proxy so the key never ships to the browser.
    this.apiKey = config.apiKey || 'AQ.Ab8RN6Jez9QgGpIXAgUlMr_FHDV5zyoGwl1gznJUg9Ufn7--qQ';

    // 'gemini-pro' was shut down — it 404s on every call, which is why the
    // assistant appeared broken. gemini-2.5-flash is the current fast/cheap
    // general-purpose model on the v1beta REST API.
    this.model = config.model || 'gemini-2.5-flash';
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.conversationHistory = [];
    this.systemPrompt = `You are Agora Assistant, a helpful AI powered by Gemini. You assist users on Agora, a global forum for design, science, culture, and more. 

Your personality:
- Friendly and conversational
- Helpful with summaries, drafts, and explanations
- Knowledgeable about design, technology, science, and culture
- Concise but thorough
- Use markdown formatting when appropriate

You can help with:
- Summarizing trending topics
- Drafting posts and replies
- Explaining complex topics
- Providing writing suggestions
- Answering questions about Agora

Keep responses focused and under 200 words unless asked for more detail.`;

    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(userMessage) {
    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    try {
      const response = await this._callGeminiAPI(userMessage);

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response
      });

      return response;
    } catch (error) {
      // Remove the message from history if the call fails
      this.conversationHistory.pop();
      throw error;
    }
  }

  /**
   * Call Gemini API with retry logic
   */
  async _callGeminiAPI(userMessage, attempt = 1) {
    try {
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }]
          }
        ],
        systemInstruction: {
          parts: [{ text: this.systemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1024,
          stopSequences: []
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };

      const response = await fetch(
        `${this.apiUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (_) {
          // response body wasn't JSON — fall back to statusText below
        }

        if (response.status === 429 && attempt < this.maxRetries) {
          // Rate limited - retry with exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this._callGeminiAPI(userMessage, attempt + 1);
        }

        throw new Error(
          errorData.error?.message ||
          `API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Check for content filter
      if (data.promptFeedback?.blockReason) {
        throw new Error('Your message was blocked by safety filters. Please rephrase and try again.');
      }

      // Extract response text
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('No response from AI. Please try again.');
      }

      return content;
    } catch (error) {
      if (attempt < this.maxRetries && typeof error.message === 'string' && error.message.includes('Failed to fetch')) {
        // Network error - retry
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._callGeminiAPI(userMessage, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Escape HTML special characters so AI output can never be
   * interpreted as markup/script when dropped into innerHTML.
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format message for display
   * IMPORTANT: escapes raw text first, then re-applies markdown-like
   * formatting on top of the escaped string. This was previously missing,
   * meaning any "<", ">" etc. in a response would be rendered as live HTML.
   */
  formatMessage(text) {
    let formatted = this._escapeHtml(text)
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n/g, '<br>');

    return formatted;
  }

  /**
   * Get preset suggestions for empty state
   */
  getSuggestions() {
    return [
      "Summarize what's trending today",
      "Help me draft a reply",
      "Explain a topic simply",
      "What's new in AI this week?",
      "Give me writing tips"
    ];
  }

  /**
   * Check if message has follow-up context
   */
  hasContext() {
    return this.conversationHistory.length > 0;
  }

  /**
   * Validate API key format
   */
  validateAPIKey(key) {
    return typeof key === 'string' && key.length > 20;
  }

  /**
   * Update API key
   */
  updateAPIKey(newKey) {
    if (!this.validateAPIKey(newKey)) {
      throw new Error('Invalid API key format');
    }
    this.apiKey = newKey;
  }
}

// Initialize chat instance globally
const agoraChat = new AgoraAIChat({
  apiKey: 'AQ.Ab8RN6Jez9QgGpIXAgUlMr_FHDV5zyoGwl1gznJUg9Ufn7--qQ'
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AgoraAIChat;
}
