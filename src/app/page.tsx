"use client"

import { useState } from 'react'
import { Upload, FileText, Download, Sparkles, Settings, Users, Search, Zap, Code, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ConversationParser, ParsedConversation } from '@/lib/conversationParser'
import { SmartHighlighter, CategorizationResult } from '@/lib/smartHighlighter'
import { PDFTemplate } from '@/lib/pdfGenerator'
import { useToast } from '@/hooks/use-toast'

export default function Home() {
  const [conversationText, setConversationText] = useState('')
  const [parsedConversation, setParsedConversation] = useState<ParsedConversation | null>(null)
  const [categorization, setCategorization] = useState<CategorizationResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const { toast } = useToast()

  const smartHighlighter = new SmartHighlighter()

  // Default templates (moved from PDFGenerator to avoid browser import issues)
  const getDefaultTemplates = (): PDFTemplate[] => [
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setConversationText(content)
        toast({
          title: "File uploaded",
          description: `Successfully loaded ${file.name}`,
        })
      }
      reader.readAsText(file)
    }
  }

  const handleProcessConversation = async () => {
    if (!conversationText.trim()) {
      toast({
        title: "No conversation text",
        description: "Please paste or upload a conversation first",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      // Parse the conversation
      const parsed = ConversationParser.parse(conversationText)
      setParsedConversation(parsed)

      // Categorize with AI
      const categorized = await smartHighlighter.categorizeConversation(parsed)
      setCategorization(categorized)

      // Set default template
      const templates = getDefaultTemplates()
      setSelectedTemplate(templates[0])

      toast({
        title: "Conversation processed",
        description: `Found ${categorized.highlights.length} highlights and ${categorized.action_items.length} action items`,
      })
    } catch (error) {
      console.error('Error processing conversation:', error)
      toast({
        title: "Processing failed",
        description: "Failed to process the conversation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGeneratePDF = async () => {
    if (!conversationText.trim() || !selectedTemplate) {
      toast({
        title: "Missing data",
        description: "Please process a conversation first and select a template",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingPDF(true)
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationText,
          template: selectedTemplate,
          options: {
            includeTableOfContents: true,
            pageSize: 'A4',
            margin: {
              top: '20mm',
              right: '20mm',
              bottom: '20mm',
              left: '20mm'
            }
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'conversation.pdf'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create download link
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "PDF generated",
        description: "Your PDF has been downloaded successfully!",
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "PDF generation failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const templates = getDefaultTemplates()

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header Section */}
      <header className="border-b shadow-sm" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>LLMs to PDF</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
              Transform AI Conversations into Professional PDFs
            </h2>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--color-secondary)' }}>
              Extract key insights, categorize highlights, and export conversations from ChatGPT, Claude, Gemini, and more with intelligent AI-powered analysis and beautiful templates.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-center h-12 w-12 rounded-lg mb-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                <Upload className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Multi-Format Import</h3>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>Support for ChatGPT, Claude, Gemini, Perplexity and custom formats</p>
            </div>
            
            <div className="p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-center h-12 w-12 rounded-lg mb-4" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                <Sparkles className="h-6 w-6" style={{ color: '#22c55e' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>AI Categorization</h3>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>Automatically identify code, insights, action items, and resources</p>
            </div>
            
            <div className="p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-center h-12 w-12 rounded-lg mb-4" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}>
                <FileText className="h-6 w-6" style={{ color: '#9333ea' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Professional Templates</h3>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>Academic, meeting notes, project summary, and study guide layouts</p>
            </div>
            
            <div className="p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-center h-12 w-12 rounded-lg mb-4" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                <Download className="h-6 w-6" style={{ color: '#f97316' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Multiple Export Formats</h3>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>PDF, Markdown, Notion, Obsidian, and Anki flashcards</p>
            </div>
          </div>
        </section>

        {/* Main Interface */}
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Input Section */}
          <section className="border rounded-xl p-8 shadow-sm" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Import Conversation</h3>
              <p style={{ color: 'var(--color-secondary)' }}>Upload a file or paste your AI conversation text below</p>
            </div>
            
            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
                Upload File
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept=".txt,.md,.json"
                  onChange={handleFileUpload}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold transition-colors"
                  style={{ color: 'var(--color-secondary)' }}
                />
              </div>
            </div>

            {/* Text Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
                Or Paste Conversation Text
              </label>
              <textarea
                value={conversationText}
                onChange={(e) => setConversationText(e.target.value)}
                placeholder="Paste your AI conversation here... (e.g., ChatGPT, Claude, Gemini, etc.)"
                className="w-full h-40 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ 
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-card)',
                  color: 'var(--color-text)'
                }}
              />
            </div>

            <Button 
              onClick={handleProcessConversation}
              disabled={isProcessing || !conversationText.trim()}
              className="w-full h-12 text-lg font-semibold"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {isProcessing ? (
                <>
                  <Zap className="h-5 w-5 mr-3 animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-3" />
                  Process with AI
                </>
              )}
            </Button>
          </section>

          {/* Results Section */}
          {parsedConversation && categorization && (
            <section className="border rounded-xl p-8 shadow-sm" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Analysis Results</h3>
                <p style={{ color: 'var(--color-secondary)' }}>Your conversation has been analyzed and categorized</p>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-6 rounded-xl border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                  <div className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>{categorization.highlights.length}</div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>Highlights</div>
                </div>
                
                <div className="text-center p-6 rounded-xl border" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                  <div className="text-3xl font-bold mb-2" style={{ color: '#22c55e' }}>{categorization.action_items.length}</div>
                  <div className="text-sm font-medium" style={{ color: '#22c55e' }}>Action Items</div>
                </div>
                
                <div className="text-center p-6 rounded-xl border" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)', borderColor: 'rgba(147, 51, 234, 0.3)' }}>
                  <div className="text-3xl font-bold mb-2" style={{ color: '#9333ea' }}>{categorization.resources.length}</div>
                  <div className="text-sm font-medium" style={{ color: '#9333ea' }}>Resources</div>
                </div>
                
                <div className="text-center p-6 rounded-xl border" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.3)' }}>
                  <div className="text-3xl font-bold mb-2" style={{ color: '#f97316' }}>{categorization.questions.length}</div>
                  <div className="text-sm font-medium" style={{ color: '#f97316' }}>Questions</div>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-3 flex items-center" style={{ color: 'var(--color-text)' }}>
                  <Lightbulb className="h-5 w-5 mr-2" style={{ color: '#eab308' }} />
                  Summary
                </h4>
                <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-muted)', borderColor: 'var(--color-border)' }}>
                  <p style={{ color: 'var(--color-text)' }} className="leading-relaxed">{categorization.summary}</p>
                </div>
              </div>

              {/* Key Topics */}
              {categorization.key_topics.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold mb-3 flex items-center" style={{ color: 'var(--color-text)' }}>
                    <Code className="h-5 w-5 mr-2" style={{ color: 'var(--color-primary)' }} />
                    Key Topics
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {categorization.key_topics.map((topic, index) => (
                      <span key={index} className="px-4 py-2 rounded-full text-sm font-medium border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Selection */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--color-text)' }}>
                  <FileText className="h-5 w-5 mr-2" style={{ color: '#9333ea' }} />
                  Select PDF Template
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.name}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedTemplate?.name === template.name
                          ? 'border-blue-500'
                          : 'hover:border-blue-300'
                      }`}
                      style={{ 
                        borderColor: selectedTemplate?.name === template.name ? 'var(--color-primary)' : 'var(--color-border)',
                        backgroundColor: selectedTemplate?.name === template.name ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-card)'
                      }}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <h5 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{template.name}</h5>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-secondary)' }}>{template.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate PDF Button */}
              <Button 
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF || !selectedTemplate}
                className="w-full h-14 text-lg font-semibold"
                style={{ backgroundColor: '#22c55e' }}
                size="lg"
              >
                {isGeneratingPDF ? (
                  <>
                    <Zap className="h-6 w-6 mr-3 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-6 w-6 mr-3" />
                    Generate & Download PDF
                  </>
                )}
              </Button>
            </section>
          )}

          {/* Upcoming Features */}
          <section className="border rounded-xl p-8" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2 flex items-center" style={{ color: 'var(--color-text)' }}>
                🚀 Coming Soon
              </h3>
              <p style={{ color: 'var(--color-secondary)' }}>Exciting new features we&apos;re working on</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                    <Users className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Collaborative Highlighting</h4>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>Team highlighting and comments for shared conversations</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                    <Search className="h-5 w-5" style={{ color: '#22c55e' }} />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Semantic Search</h4>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>Intelligent search across all saved conversations</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}>
                    <Settings className="h-5 w-5" style={{ color: '#9333ea' }} />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Browser Extension</h4>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>One-click highlight and save from any AI chat interface</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                    <FileText className="h-5 w-5" style={{ color: '#f97316' }} />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Multiple Export Formats</h4>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>Export to Notion, Obsidian, and Anki flashcards</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
