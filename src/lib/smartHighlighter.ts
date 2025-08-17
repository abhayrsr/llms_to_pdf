import OpenAI from 'openai'
import { ParsedConversation } from './conversationParser'

export interface Highlight {
  content: string
  category: 'code' | 'insight' | 'action_item' | 'resource' | 'question' | 'other'
  confidence_score: number
  tags: string[]
  notes?: string
  position: {
    messageIndex: number
    startChar: number
    endChar: number
  }
}

export interface CategorizationResult {
  highlights: Highlight[]
  summary: string
  key_topics: string[]
  action_items: string[]
  resources: string[]
  questions: string[]
}

export class SmartHighlighter {
  private openai: OpenAI | null = null

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    }
  }

  async categorizeConversation(conversation: ParsedConversation): Promise<CategorizationResult> {
    // If OpenAI is not available, use fallback categorization
    if (!this.openai) {
      return this.fallbackCategorization(conversation)
    }

    try {
      const prompt = this.buildCategorizationPrompt(conversation)
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing AI conversations and extracting key insights. Your task is to:
1. Identify and categorize important highlights
2. Provide confidence scores for each highlight
3. Extract key topics, action items, resources, and questions
4. Suggest relevant tags for each highlight

Respond with valid JSON only.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      // Try to parse the JSON response
      try {
        const result = JSON.parse(content) as CategorizationResult
        return this.validateAndEnhanceResult(result, conversation)
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError)
        return this.fallbackCategorization(conversation)
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      return this.fallbackCategorization(conversation)
    }
  }

  private buildCategorizationPrompt(conversation: ParsedConversation): string {
    const messages = conversation.messages.map((msg, index) => 
      `${msg.role.toUpperCase()} (${index}): ${msg.content}`
    ).join('\n\n')

    return `Analyze this AI conversation and extract key highlights:

CONVERSATION:
${messages}

SOURCE: ${conversation.source}
CATEGORY: ${conversation.category || 'general'}

Please provide a JSON response with the following structure:
{
  "highlights": [
    {
      "content": "exact text from conversation",
      "category": "code|insight|action_item|resource|question|other",
      "confidence_score": 0.95,
      "tags": ["tag1", "tag2"],
      "notes": "brief explanation",
      "position": {
        "messageIndex": 0,
        "startChar": 0,
        "endChar": 50
      }
    }
  ],
  "summary": "brief summary of the conversation",
  "key_topics": ["topic1", "topic2"],
  "action_items": ["action1", "action2"],
  "resources": ["resource1", "resource2"],
  "questions": ["question1", "question2"]
}

Focus on:
- Code snippets and technical details
- Actionable insights and recommendations
- Resources, links, and references
- Important questions and their answers
- Key learnings and takeaways

Ensure all highlights have valid positions and confidence scores.`
  }

  private validateAndEnhanceResult(result: CategorizationResult, conversation: ParsedConversation): CategorizationResult {
    // Validate and enhance the highlights
    const validatedHighlights = result.highlights
      .filter(highlight => this.validateHighlight(highlight, conversation))
      .map(highlight => this.enhanceHighlight(highlight, conversation))

    return {
      highlights: validatedHighlights,
      summary: result.summary || this.generateFallbackSummary(conversation),
      key_topics: result.key_topics || [],
      action_items: result.action_items || [],
      resources: result.resources || [],
      questions: result.questions || []
    }
  }

  private validateHighlight(highlight: Highlight, conversation: ParsedConversation): boolean {
    // Check if the highlight content exists in the conversation
    const messageIndex = highlight.position.messageIndex
    if (messageIndex < 0 || messageIndex >= conversation.messages.length) {
      return false
    }

    const message = conversation.messages[messageIndex]
    const content = message.content
    const startChar = highlight.position.startChar
    const endChar = highlight.position.endChar

    if (startChar < 0 || endChar > content.length || startChar >= endChar) {
      return false
    }

    const extractedContent = content.substring(startChar, endChar)
    return extractedContent.trim() === highlight.content.trim()
  }

  private enhanceHighlight(highlight: Highlight, conversation: ParsedConversation): Highlight {
    // Enhance tags based on content analysis
    const enhancedTags = [...highlight.tags]
    
    if (highlight.content.includes('```')) {
      enhancedTags.push('code')
    }
    if (highlight.content.includes('http')) {
      enhancedTags.push('link')
    }
    if (highlight.content.includes('?')) {
      enhancedTags.push('question')
    }
    if (highlight.content.toLowerCase().includes('todo') || highlight.content.toLowerCase().includes('task')) {
      enhancedTags.push('todo')
    }

    // Remove duplicates
    const uniqueTags = [...new Set(enhancedTags)]

    return {
      ...highlight,
      tags: uniqueTags,
      confidence_score: Math.min(highlight.confidence_score, 1.0)
    }
  }

  private fallbackCategorization(conversation: ParsedConversation): CategorizationResult {
    const highlights: Highlight[] = []
    let messageIndex = 0

    for (const message of conversation.messages) {
      if (message.role === 'assistant') {
        // Extract code blocks
        const codeBlocks = this.extractCodeBlocks(message.content, messageIndex)
        highlights.push(...codeBlocks)

        // Extract potential action items
        const actionItems = this.extractActionItems(message.content, messageIndex)
        highlights.push(...actionItems)

        // Extract questions
        const questions = this.extractQuestions(message.content, messageIndex)
        highlights.push(...questions)
      }
      messageIndex++
    }

    return {
      highlights,
      summary: this.generateFallbackSummary(conversation),
      key_topics: this.extractKeyTopics(conversation),
      action_items: highlights.filter(h => h.category === 'action_item').map(h => h.content),
      resources: highlights.filter(h => h.category === 'resource').map(h => h.content),
      questions: highlights.filter(h => h.category === 'question').map(h => h.content)
    }
  }

  private extractCodeBlocks(content: string, messageIndex: number): Highlight[] {
    const codeBlockRegex = /```[\s\S]*?```/g
    const highlights: Highlight[] = []
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      highlights.push({
        content: match[0],
        category: 'code',
        confidence_score: 0.9,
        tags: ['code'],
        position: {
          messageIndex,
          startChar: match.index,
          endChar: match.index + match[0].length
        }
      })
    }

    return highlights
  }

  private extractActionItems(content: string, messageIndex: number): Highlight[] {
    const actionItemRegex = /(?:^|\n)(?:[-*]\s*|•\s*)?(?:TODO|TASK|ACTION|NEXT STEP|FUTURE|PLAN):?\s*(.+?)(?:\n|$)/gi
    const highlights: Highlight[] = []
    let match

    while ((match = actionItemRegex.exec(content)) !== null) {
      highlights.push({
        content: match[1].trim(),
        category: 'action_item',
        confidence_score: 0.8,
        tags: ['action', 'todo'],
        position: {
          messageIndex,
          startChar: match.index,
          endChar: match.index + match[0].length
        }
      })
    }

    return highlights
  }

  private extractQuestions(content: string, messageIndex: number): Highlight[] {
    const questionRegex = /[^.!?]*\?/g
    const highlights: Highlight[] = []
    let match

    while ((match = questionRegex.exec(content)) !== null) {
      const question = match[0].trim()
      if (question.length > 10 && question.length < 200) {
        highlights.push({
          content: question,
          category: 'question',
          confidence_score: 0.7,
          tags: ['question'],
          position: {
            messageIndex,
            startChar: match.index,
            endChar: match.index + match[0].length
          }
        })
      }
    }

    return highlights
  }

  private generateFallbackSummary(conversation: ParsedConversation): string {
    const userMessages = conversation.messages.filter(m => m.role === 'user')
    const assistantMessages = conversation.messages.filter(m => m.role === 'assistant')
    
    return `Conversation about ${conversation.title} with ${userMessages.length} user questions and ${assistantMessages.length} AI responses.`
  }

  private extractKeyTopics(_conversation: ParsedConversation): string[] {
    const topics: string[] = []
    const content = _conversation.messages.map(m => m.content).join(' ').toLowerCase()
    
    if (content.includes('react') || content.includes('frontend')) topics.push('Frontend Development')
    if (content.includes('api') || content.includes('backend')) topics.push('Backend Development')
    if (content.includes('database') || content.includes('sql')) topics.push('Database')
    if (content.includes('deployment') || content.includes('docker')) topics.push('Deployment')
    if (content.includes('testing') || content.includes('test')) topics.push('Testing')
    if (content.includes('security') || content.includes('auth')) topics.push('Security')
    
    return topics.length > 0 ? topics : ['General Discussion']
  }

  async enhanceHighlightsWithAI(highlights: Highlight[], conversation: ParsedConversation): Promise<Highlight[]> {
    if (!this.openai) {
      return highlights
    }

    try {
      const prompt = `Review and enhance these conversation highlights. For each highlight, suggest:
1. Better categorization if needed
2. Additional relevant tags
3. Brief notes explaining the importance
4. Adjust confidence score if needed

Highlights: ${JSON.stringify(highlights, null, 2)}

Conversation context: ${conversation.title} (${conversation.source})

Respond with enhanced highlights in JSON format.`

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing and enhancing conversation highlights. Provide clear, actionable improvements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        try {
          const enhanced = JSON.parse(content) as Highlight[]
          return enhanced.map(h => ({ ...h, confidence_score: Math.min(h.confidence_score, 1.0) }))
        } catch (parseError) {
          console.error('Failed to parse enhanced highlights:', parseError)
        }
      }
    } catch (error) {
      console.error('Failed to enhance highlights with AI:', error)
    }

    return highlights
  }
}
