import { NextRequest, NextResponse } from 'next/server'
import { PDFGenerator, PDFOptions } from '@/lib/pdfGenerator'
import { ConversationParser } from '@/lib/conversationParser'
import { SmartHighlighter } from '@/lib/smartHighlighter'

export async function POST(request: NextRequest) {
  try {
    const { conversationText, template, options } = await request.json()

    if (!conversationText) {
      return NextResponse.json(
        { error: 'Conversation text is required' },
        { status: 400 }
      )
    }

    // Parse the conversation
    const parsed = ConversationParser.parse(conversationText)
    
    // Categorize with AI
    const smartHighlighter = new SmartHighlighter()
    const categorized = await smartHighlighter.categorizeConversation(parsed)

    // Generate PDF
    const pdfGenerator = new PDFGenerator()
    const pdfOptions: PDFOptions = {
      template: template || pdfGenerator.getDefaultTemplates()[0],
      includeTableOfContents: options?.includeTableOfContents ?? true,
      pageSize: options?.pageSize || 'A4',
      margin: options?.margin || {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    }

    const pdfBuffer = await pdfGenerator.generatePDF(parsed, categorized, pdfOptions)
    
    // Clean up
    await pdfGenerator.close()

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${parsed.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
