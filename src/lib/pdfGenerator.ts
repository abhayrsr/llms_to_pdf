import puppeteer, { Browser, Page } from 'puppeteer'
import { Highlight, CategorizationResult } from './smartHighlighter'
import { ParsedConversation, ParsedMessage } from './conversationParser'

export interface PDFTemplate {
  name: string
  description: string
  layout: 'academic' | 'meeting' | 'project' | 'study' | 'custom'
  styling: {
    fontFamily: string
    fontSize: string
    lineHeight: string
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    textColor: string
  }
  sections: {
    title: boolean
    summary: boolean
    highlights: boolean
    actionItems: boolean
    resources: boolean
    questions: boolean
    fullConversation: boolean
  }
}

export interface PDFOptions {
  template: PDFTemplate
  includeMetadata?: boolean
  includeTableOfContents?: boolean
  pageSize?: 'A4' | 'Letter' | 'Legal'
  margin?: {
    top: string
    right: string
    bottom: string
    left: string
  }
}

export class PDFGenerator {
  private browser: Browser | null = null

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  async generatePDF(
    conversation: ParsedConversation,
    categorization: CategorizationResult,
    options: PDFOptions
  ): Promise<Buffer> {
    await this.initialize()
    
    if (!this.browser) {
      throw new Error('Failed to initialize browser')
    }

    const page: Page = await this.browser.newPage()
    
    try {
      const html = this.generateHTML(conversation, categorization, options)
      await page.setContent(html, { waitUntil: 'networkidle0' })
      
      const pdfBuffer = await page.pdf({
        format: options.pageSize || 'A4',
        margin: options.margin || {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true,
        displayHeaderFooter: false
      })

      return Buffer.from(pdfBuffer)
    } finally {
      await page.close()
    }
  }

  private generateHTML(
    conversation: ParsedConversation,
    categorization: CategorizationResult,
    options: PDFOptions
  ): string {
    const template = options.template
    const { styling, sections } = template

    const css = this.generateCSS(styling)
    const content = this.generateContent(conversation, categorization, sections, options)

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${conversation.title}</title>
        <style>
          ${css}
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `
  }

  private generateCSS(styling: PDFTemplate['styling']): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: ${styling.fontFamily || 'Arial, sans-serif'};
        font-size: ${styling.fontSize || '12px'};
        line-height: ${styling.lineHeight || '1.6'};
        color: ${styling.textColor || '#333'};
        background-color: ${styling.backgroundColor || '#ffffff'};
        padding: 20px;
      }
      
      .header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 3px solid ${styling.primaryColor || '#2563eb'};
      }
      
      .title {
        font-size: 24px;
        font-weight: bold;
        color: ${styling.primaryColor || '#2563eb'};
        margin-bottom: 10px;
      }
      
      .metadata {
        font-size: 14px;
        color: ${styling.secondaryColor || '#6b7280'};
        margin-bottom: 20px;
      }
      
      .section {
        margin-bottom: 25px;
        page-break-inside: avoid;
      }
      
      .section-title {
        font-size: 18px;
        font-weight: bold;
        color: ${styling.primaryColor || '#2563eb'};
        margin-bottom: 15px;
        padding: 10px;
        background-color: ${styling.secondaryColor || '#f3f4f6'};
        border-left: 4px solid ${styling.primaryColor || '#2563eb'};
      }
      
      .highlight {
        margin-bottom: 15px;
        padding: 15px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background-color: #fafafa;
        page-break-inside: avoid;
      }
      
      .highlight-content {
        margin-bottom: 10px;
        font-weight: 500;
      }
      
      .highlight-meta {
        display: flex;
        gap: 15px;
        font-size: 12px;
        color: ${styling.secondaryColor || '#6b7280'};
      }
      
      .category-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
      }
      
      .category-code { background-color: #dbeafe; color: #1e40af; }
      .category-insight { background-color: #d1fae5; color: #065f46; }
      .category-action_item { background-color: #fef3c7; color: #92400e; }
      .category-resource { background-color: #e0e7ff; color: #3730a3; }
      .category-question { background-color: #fce7f3; color: #be185d; }
      .category-other { background-color: #f3f4f6; color: #374151; }
      
      .confidence-score {
        padding: 2px 6px;
        background-color: #10b981;
        color: white;
        border-radius: 4px;
        font-size: 10px;
      }
      
      .tags {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
      }
      
      .tag {
        padding: 2px 6px;
        background-color: ${styling.secondaryColor || '#f3f4f6'};
        color: ${styling.textColor || '#333'};
        border-radius: 4px;
        font-size: 10px;
      }
      
      .summary {
        font-size: 16px;
        line-height: 1.8;
        color: ${styling.textColor || '#333'};
        background-color: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid ${styling.primaryColor || '#2563eb'};
      }
      
      .action-items, .resources, .questions {
        list-style: none;
      }
      
      .action-items li, .resources li, .questions li {
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .action-items li:last-child, .resources li:last-child, .questions li:last-child {
        border-bottom: none;
      }
      
      .conversation {
        margin-top: 30px;
      }
      
      .message {
        margin-bottom: 20px;
        padding: 15px;
        border-radius: 8px;
        page-break-inside: avoid;
      }
      
      .message-user {
        background-color: #eff6ff;
        border-left: 4px solid #3b82f6;
      }
      
      .message-assistant {
        background-color: #f0fdf4;
        border-left: 4px solid #22c55e;
      }
      
      .message-system {
        background-color: #fef3c7;
        border-left: 4px solid #f59e0b;
      }
      
      .message-role {
        font-weight: bold;
        margin-bottom: 8px;
        text-transform: capitalize;
        color: ${styling.primaryColor || '#2563eb'};
      }
      
      .message-content {
        white-space: pre-wrap;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.4;
      }
      
      .table-of-contents {
        margin-bottom: 30px;
        padding: 20px;
        background-color: #f8fafc;
        border-radius: 8px;
      }
      
      .toc-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 15px;
        color: ${styling.primaryColor || '#2563eb'};
      }
      
      .toc-item {
        margin-bottom: 8px;
        padding-left: 20px;
      }
      
      .toc-link {
        color: ${styling.primaryColor || '#2563eb'};
        text-decoration: none;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      @media print {
        body { padding: 0; }
        .page-break { page-break-before: always; }
      }
    `
  }

  private generateContent(
    conversation: ParsedConversation,
    categorization: CategorizationResult,
    sections: PDFTemplate['sections'],
    options: PDFOptions
  ): string {
    let content = ''

    // Header
    content += `
      <div class="header">
        <div class="title">${conversation.title}</div>
        <div class="metadata">
          Source: ${conversation.source} | 
          Category: ${conversation.category || 'General'} | 
          Generated: ${new Date().toLocaleDateString()}
        </div>
      </div>
    `

    // Table of Contents
    if (options.includeTableOfContents) {
      content += this.generateTableOfContents(sections)
    }

    // Summary
    if (sections.summary) {
      content += `
        <div class="section">
          <div class="section-title">Summary</div>
          <div class="summary">${categorization.summary}</div>
        </div>
      `
    }

    // Key Topics
    if (categorization.key_topics.length > 0) {
      content += `
        <div class="section">
          <div class="section-title">Key Topics</div>
          <ul>
            ${categorization.key_topics.map(topic => `<li>${topic}</li>`).join('')}
          </ul>
        </div>
      `
    }

    // Highlights
    if (sections.highlights && categorization.highlights.length > 0) {
      content += `
        <div class="section">
          <div class="section-title">Key Highlights</div>
          ${categorization.highlights.map(highlight => this.generateHighlightHTML(highlight)).join('')}
        </div>
      `
    }

    // Action Items
    if (sections.actionItems && categorization.action_items.length > 0) {
      content += `
        <div class="section">
          <div class="section-title">Action Items</div>
          <ul class="action-items">
            ${categorization.action_items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `
    }

    // Resources
    if (sections.resources && categorization.resources.length > 0) {
      content += `
        <div class="section">
          <div class="section-title">Resources & References</div>
          <ul class="resources">
            ${categorization.resources.map(resource => `<li>${resource}</li>`).join('')}
          </ul>
        </div>
      `
    }

    // Questions
    if (sections.questions && categorization.questions.length > 0) {
      content += `
        <div class="section">
          <div class="section-title">Questions & Answers</div>
          <ul class="questions">
            ${categorization.questions.map(question => `<li>${question}</li>`).join('')}
          </ul>
        </div>
      `
    }

    // Full Conversation
    if (sections.fullConversation) {
      content += `
        <div class="section conversation">
          <div class="section-title">Full Conversation</div>
          ${conversation.messages.map(message => this.generateMessageHTML(message)).join('')}
        </div>
      `
    }

    return content
  }

  private generateHighlightHTML(highlight: Highlight): string {
    return `
      <div class="highlight">
        <div class="highlight-content">${highlight.content}</div>
        <div class="highlight-meta">
          <span class="category-badge category-${highlight.category}">${highlight.category.replace('_', ' ')}</span>
          <span class="confidence-score">${Math.round(highlight.confidence_score * 100)}%</span>
          <div class="tags">
            ${highlight.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
        ${highlight.notes ? `<div class="highlight-notes">${highlight.notes}</div>` : ''}
      </div>
    `
  }

  private generateMessageHTML(message: ParsedMessage): string {
    return `
      <div class="message message-${message.role}">
        <div class="message-role">${message.role}</div>
        <div class="message-content">${message.content}</div>
      </div>
    `
  }

  private generateTableOfContents(sections: PDFTemplate['sections']): string {
    const tocItems = []
    
    if (sections.summary) tocItems.push('<div class="toc-item"><a href="#summary" class="toc-link">Summary</a></div>')
    if (sections.highlights) tocItems.push('<div class="toc-item"><a href="#highlights" class="toc-link">Key Highlights</a></div>')
    if (sections.actionItems) tocItems.push('<div class="toc-item"><a href="#action-items" class="toc-link">Action Items</a></div>')
    if (sections.resources) tocItems.push('<div class="toc-item"><a href="#resources" class="toc-link">Resources & References</a></div>')
    if (sections.questions) tocItems.push('<div class="toc-item"><a href="#questions" class="toc-link">Questions & Answers</a></div>')
    if (sections.fullConversation) tocItems.push('<div class="toc-item"><a href="#conversation" class="toc-link">Full Conversation</a></div>')

    return `
      <div class="table-of-contents">
        <div class="toc-title">Table of Contents</div>
        ${tocItems.join('')}
      </div>
    `
  }

  getDefaultTemplates(): PDFTemplate[] {
    return [
      {
        name: 'Academic Paper',
        description: 'Formal academic paper format with citations and structured sections',
        layout: 'academic',
        styling: {
          fontFamily: 'Times New Roman, serif',
          fontSize: '12px',
          lineHeight: '1.5',
          primaryColor: '#1f2937',
          secondaryColor: '#6b7280',
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        },
        sections: {
          title: true,
          summary: true,
          highlights: true,
          actionItems: false,
          resources: true,
          questions: true,
          fullConversation: false
        }
      },
      {
        name: 'Meeting Notes',
        description: 'Professional meeting notes format with action items and key points',
        layout: 'meeting',
        styling: {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          lineHeight: '1.4',
          primaryColor: '#2563eb',
          secondaryColor: '#6b7280',
          backgroundColor: '#ffffff',
          textColor: '#374151'
        },
        sections: {
          title: true,
          summary: true,
          highlights: true,
          actionItems: true,
          resources: true,
          questions: true,
          fullConversation: false
        }
      },
      {
        name: 'Project Summary',
        description: 'Project-focused format highlighting technical details and next steps',
        layout: 'project',
        styling: {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '11px',
          lineHeight: '1.5',
          primaryColor: '#059669',
          secondaryColor: '#6b7280',
          backgroundColor: '#ffffff',
          textColor: '#111827'
        },
        sections: {
          title: true,
          summary: true,
          highlights: true,
          actionItems: true,
          resources: true,
          questions: false,
          fullConversation: false
        }
      },
      {
        name: 'Study Guide',
        description: 'Educational format optimized for learning and review',
        layout: 'study',
        styling: {
          fontFamily: 'Georgia, serif',
          fontSize: '12px',
          lineHeight: '1.6',
          primaryColor: '#7c3aed',
          secondaryColor: '#8b5cf6',
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        },
        sections: {
          title: true,
          summary: true,
          highlights: true,
          actionItems: false,
          resources: true,
          questions: true,
          fullConversation: false
        }
      }
    ]
  }
}
