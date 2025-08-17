export type ConversationSource = 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'custom'

export interface ParsedMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  metadata?: Record<string, unknown>
}

export interface ParsedConversation {
  title: string
  source: ConversationSource
  messages: ParsedMessage[]
  metadata: Record<string, unknown>
  tags: string[]
  category?: string
}

export class ConversationParser {
  private static sourcePatterns = {
    chatgpt: [
      /ChatGPT/i,
      /OpenAI/i,
      /GPT-4/i,
      /GPT-3\.5/i,
      /Chat History/i
    ],
    claude: [
      /Claude/i,
      /Anthropic/i,
      /Claude-3/i,
      /Claude-2/i
    ],
    gemini: [
      /Gemini/i,
      /Google AI/i,
      /Bard/i
    ],
    perplexity: [
      /Perplexity/i,
      /Perplexity AI/i
    ]
  }

  static detectSource(content: string): ConversationSource {
    for (const [source, patterns] of Object.entries(this.sourcePatterns)) {
      if (patterns.some(pattern => pattern.test(content))) {
        return source as ConversationSource
      }
    }
    return 'custom'
  }

  static parseChatGPT(content: string): ParsedConversation {
    const lines = content.split('\n')
    const messages: ParsedMessage[] = []
    let currentRole: 'user' | 'assistant' | 'system' = 'user'
    let currentContent = ''
    let title = 'ChatGPT Conversation'

    for (const line of lines) {
      if (line.startsWith('User:')) {
        if (currentContent.trim()) {
          messages.push({ role: currentRole, content: currentContent.trim() })
        }
        currentRole = 'user'
        currentContent = line.replace('User:', '').trim()
      } else if (line.startsWith('Assistant:') || line.startsWith('ChatGPT:')) {
        if (currentContent.trim()) {
          messages.push({ role: currentRole, content: currentContent.trim() })
        }
        currentRole = 'assistant'
        currentContent = line.replace(/^(Assistant|ChatGPT):/, '').trim()
      } else if (line.startsWith('System:')) {
        if (currentContent.trim()) {
          messages.push({ role: currentRole, content: currentContent.trim() })
        }
        currentRole = 'system'
        currentContent = line.replace('System:', '').trim()
      } else {
        if (currentContent) {
          currentContent += '\n' + line
        } else {
          currentContent = line
        }
      }
    }

    if (currentContent.trim()) {
      messages.push({ role: currentRole, content: currentContent.trim() })
    }

    // Extract title from first user message
    if (messages.length > 0 && messages[0].role === 'user') {
      const firstMessage = messages[0].content
      const firstLine = firstMessage.split('\n')[0]
      if (firstLine.length < 100) {
        title = firstLine
      }
    }

    return {
      title,
      source: 'chatgpt',
      messages,
      metadata: { originalFormat: 'chatgpt' },
      tags: this.extractTags(content),
      category: this.categorizeConversation(messages)
    }
  }

  static parseClaude(content: string): ParsedConversation {
    const lines = content.split('\n')
    const messages: ParsedMessage[] = []
    let currentRole: 'user' | 'assistant' | 'system' = 'user'
    let currentContent = ''
    let title = 'Claude Conversation'

    for (const line of lines) {
      if (line.startsWith('Human:')) {
        if (currentContent.trim()) {
          messages.push({ role: currentRole, content: currentContent.trim() })
        }
        currentRole = 'user'
        currentContent = line.replace('Human:', '').trim()
      } else if (line.startsWith('Assistant:') || line.startsWith('Claude:')) {
        if (currentContent.trim()) {
          messages.push({ role: currentRole, content: currentContent.trim() })
        }
        currentRole = 'assistant'
        currentContent = line.replace(/^(Assistant|Claude):/, '').trim()
      } else if (line.startsWith('System:')) {
        if (currentContent.trim()) {
          messages.push({ role: currentRole, content: currentContent.trim() })
        }
        currentRole = 'system'
        currentContent = line.replace('System:', '').trim()
      } else {
        if (currentContent) {
          currentContent += '\n' + line
        } else {
          currentContent = line
        }
      }
    }

    if (currentContent.trim()) {
      messages.push({ role: currentRole, content: currentContent.trim() })
    }

    // Extract title from first user message
    if (messages.length > 0 && messages[0].role === 'user') {
      const firstMessage = messages[0].content
      const firstLine = firstMessage.split('\n')[0]
      if (firstLine.length < 100) {
        title = firstLine
      }
    }

    return {
      title,
      source: 'claude',
      messages,
      metadata: { originalFormat: 'claude' },
      tags: this.extractTags(content),
      category: this.categorizeConversation(messages)
    }
  }

  static parseGemini(content: string): ParsedConversation {
    const lines = content.split('\n')
    const messages: ParsedMessage[] = []
    let currentRole: 'user' | 'assistant' | 'system' = 'user'
    let currentContent = ''
    let title = 'Gemini Conversation'

    for (const line of lines) {
      if (line.startsWith('User:')) {
        if (currentContent.trim()) {
          messages.push({ role: currentRole, content: currentContent.trim() })
        }
        currentRole = 'user'
        currentContent = line.replace('User:', '').trim()
      } else if (line.startsWith('Gemini:') || line.startsWith('Assistant:')) {
        if (currentContent.trim()) {
          messages.push({ role: currentRole, content: currentContent.trim() })
        }
        currentRole = 'assistant'
        currentContent = line.replace(/^(Gemini|Assistant):/, '').trim()
      } else {
        if (currentContent) {
          currentContent += '\n' + line
        } else {
          currentContent = line
        }
      }
    }

    if (currentContent.trim()) {
      messages.push({ role: currentRole, content: currentContent.trim() })
    }

    // Extract title from first user message
    if (messages.length > 0 && messages[0].role === 'user') {
      const firstMessage = messages[0].content
      const firstLine = firstMessage.split('\n')[0]
      if (firstLine.length < 100) {
        title = firstLine
      }
    }

    return {
      title,
      source: 'gemini',
      messages,
      metadata: { originalFormat: 'gemini' },
      tags: this.extractTags(content),
      category: this.categorizeConversation(messages)
    }
  }

  static parsePerplexity(content: string): ParsedConversation {
    const lines = content.split('\n')
    const messages: ParsedMessage[] = []
    let currentRole: 'user' | 'assistant' | 'system' = 'user'
    let currentContent = ''
    let title = 'Perplexity Conversation'

    for (const line of lines) {
      if (line.startsWith('User:')) {
        if (currentContent.trim()) {
          messages.push({ role: currentRole, content: currentContent.trim() })
        }
        currentRole = 'user'
        currentContent = line.replace('User:', '').trim()
      } else if (line.startsWith('Perplexity:') || line.startsWith('Assistant:')) {
        if (currentContent.trim()) {
          messages.push({ role: currentRole, content: currentContent.trim() })
        }
        currentRole = 'assistant'
        currentContent = line.replace(/^(Perplexity|Assistant):/, '').trim()
      } else {
        if (currentContent) {
          currentContent += '\n' + line
        } else {
          currentContent = line
        }
      }
    }

    if (currentContent.trim()) {
      messages.push({ role: currentRole, content: currentContent.trim() })
    }

    // Extract title from first user message
    if (messages.length > 0 && messages[0].role === 'user') {
      const firstMessage = messages[0].content
      const firstLine = firstMessage.split('\n')[0]
      if (firstLine.length < 100) {
        title = firstLine
      }
    }

    return {
      title,
      source: 'perplexity',
      messages,
      metadata: { originalFormat: 'perplexity' },
      tags: this.extractTags(content),
      category: this.categorizeConversation(messages)
    }
  }

  static parseCustom(content: string): ParsedConversation {
    // Try to auto-detect format
    const lines = content.split('\n')
    const messages: ParsedMessage[] = []
    let title = 'Custom Conversation'

    // Simple pattern matching for common formats
    const patterns = [
      { role: 'user' as const, pattern: /^(User|Human|Me|I):/i },
      { role: 'assistant' as const, pattern: /^(Assistant|AI|Bot|ChatGPT|Claude|Gemini|Perplexity):/i },
      { role: 'system' as const, pattern: /^(System|Context|Instructions):/i }
    ]

    let currentRole: 'user' | 'assistant' | 'system' = 'user'
    let currentContent = ''

    for (const line of lines) {
      let matched = false
      for (const { role, pattern } of patterns) {
        if (pattern.test(line)) {
          if (currentContent.trim()) {
            messages.push({ role: currentRole, content: currentContent.trim() })
          }
          currentRole = role
          currentContent = line.replace(pattern, '').trim()
          matched = true
          break
        }
      }

      if (!matched) {
        if (currentContent) {
          currentContent += '\n' + line
        } else {
          currentContent = line
        }
      }
    }

    if (currentContent.trim()) {
      messages.push({ role: currentRole, content: currentContent.trim() })
    }

    // Extract title from first user message
    if (messages.length > 0 && messages[0].role === 'user') {
      const firstMessage = messages[0].content
      const firstLine = firstMessage.split('\n')[0]
      if (firstLine.length < 100) {
        title = firstLine
      }
    }

    return {
      title,
      source: 'custom',
      messages,
      metadata: { originalFormat: 'custom' },
      tags: this.extractTags(content),
      category: this.categorizeConversation(messages)
    }
  }

  static parse(content: string): ParsedConversation {
    const source = this.detectSource(content)
    
    switch (source) {
      case 'chatgpt':
        return this.parseChatGPT(content)
      case 'claude':
        return this.parseClaude(content)
      case 'gemini':
        return this.parseGemini(content)
      case 'perplexity':
        return this.parsePerplexity(content)
      default:
        return this.parseCustom(content)
    }
  }

  private static extractTags(content: string): string[] {
    const tags: string[] = []
    
    // Extract common tags based on content
    if (content.toLowerCase().includes('code') || content.includes('```')) {
      tags.push('code')
    }
    if (content.toLowerCase().includes('api') || content.toLowerCase().includes('endpoint')) {
      tags.push('api')
    }
    if (content.toLowerCase().includes('database') || content.toLowerCase().includes('sql')) {
      tags.push('database')
    }
    if (content.toLowerCase().includes('frontend') || content.toLowerCase().includes('react')) {
      tags.push('frontend')
    }
    if (content.toLowerCase().includes('backend') || content.toLowerCase().includes('server')) {
      tags.push('backend')
    }
    if (content.toLowerCase().includes('deployment') || content.toLowerCase().includes('docker')) {
      tags.push('deployment')
    }
    
    return tags
  }

  private static categorizeConversation(messages: ParsedMessage[]): string {
    const content = messages.map(m => m.content).join(' ').toLowerCase()
    
    if (content.includes('code') || content.includes('```')) {
      return 'technical'
    }
    if (content.includes('design') || content.includes('ui') || content.includes('ux')) {
      return 'design'
    }
    if (content.includes('business') || content.includes('strategy')) {
      return 'business'
    }
    if (content.includes('learning') || content.includes('tutorial')) {
      return 'learning'
    }
    
    return 'general'
  }
}
