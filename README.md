# LLMs to PDF - AI Conversation Highlights & PDF Export

Transform AI conversations from ChatGPT, Claude, Gemini, Perplexity, and more into professional, structured PDFs with intelligent AI-powered analysis and beautiful templates.

## 🚀 Features

### Core Functionality
- **Multi-Format Import**: Support for ChatGPT, Claude, Gemini, Perplexity, and custom conversation formats
- **AI-Powered Analysis**: Intelligent categorization of highlights, action items, resources, and questions
- **Professional PDF Export**: Multiple template layouts (Academic, Meeting Notes, Project Summary, Study Guide)
- **Smart Highlighting**: Automatic extraction of code snippets, insights, and actionable content

### Advanced Features
- **Template System**: Customizable PDF layouts with professional styling
- **Intelligent Categorization**: AI-powered classification with confidence scoring
- **Cross-Platform Support**: Works with any AI assistant conversation format
- **Dark/Light Mode**: Beautiful theme toggle for optimal viewing experience

### Coming Soon
- **Collaborative Highlighting**: Team highlighting and comments
- **Semantic Search**: Intelligent search across all saved conversations
- **Browser Extension**: One-click highlight and save from any AI chat interface
- **Multiple Export Formats**: Markdown, Notion blocks, Obsidian vault, Anki flashcards
- **Conversation Threading**: Link related conversations across sessions

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **AI Processing**: OpenAI GPT-4 for intelligent categorization
- **PDF Generation**: Puppeteer with custom HTML templates
- **Authentication**: Supabase Auth (ready for implementation)
- **Database**: Supabase with vector embeddings (ready for implementation)
- **Styling**: Shadcn/ui components with custom design system

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key (for AI categorization)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/llms_to_pdf.git
   cd llms_to_pdf
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Supabase Configuration (for future features)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### 1. Import Conversation
- **File Upload**: Drag and drop or select conversation files (.txt, .md, .json)
- **Text Input**: Paste conversation text directly into the textarea
- **Supported Formats**: ChatGPT, Claude, Gemini, Perplexity, and custom formats

### 2. AI Processing
- Click "Process with AI" to analyze your conversation
- The system automatically:
  - Detects conversation format
  - Extracts key highlights
  - Categorizes content (code, insights, action items, resources, questions)
  - Generates a summary and key topics

### 3. PDF Generation
- Select from available templates:
  - **Academic Paper**: Formal academic format with citations
  - **Meeting Notes**: Professional meeting notes with action items
  - **Project Summary**: Project-focused technical documentation
  - **Study Guide**: Educational format for learning and review
- Click "Generate & Download PDF" to create and download your document

## 📋 Supported Conversation Formats

### ChatGPT
```
User: How do I create a React component?
Assistant: Here's how to create a React component...
```

### Claude
```
Human: What are the best practices for API design?
Claude: Here are the key principles for API design...
```

### Gemini
```
User: Explain TypeScript generics
Gemini: TypeScript generics allow you to...
```

### Perplexity
```
User: What is the difference between REST and GraphQL?
Perplexity: REST and GraphQL are different approaches...
```

### Custom Format
The system automatically detects and parses custom conversation formats.

## 🎨 PDF Templates

### Academic Paper
- Formal academic styling with Times New Roman font
- Structured sections for highlights and resources
- Professional layout suitable for research and documentation

### Meeting Notes
- Business-friendly design with Arial font
- Emphasis on action items and key points
- Clean, professional appearance

### Project Summary
- Technical focus with Segoe UI font
- Highlights technical details and next steps
- Project management oriented

### Study Guide
- Educational design with Georgia font
- Optimized for learning and review
- Includes questions and resources sections

## 🔧 Configuration

### Customizing PDF Templates
Templates can be customized by modifying the `PDFTemplate` interface in `src/lib/pdfGenerator.ts`:

```typescript
interface PDFTemplate {
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
```

### AI Categorization Settings
Modify the AI prompts and categorization logic in `src/lib/smartHighlighter.ts` to adjust how the system identifies and categorizes content.

## 🚧 Development

### Project Structure
```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── ui/             # Shadcn/ui components
│   ├── theme-toggle.tsx # Theme toggle component
│   └── theme-provider.tsx # Theme provider
├── lib/                 # Utility libraries
│   ├── conversationParser.ts # Conversation parsing logic
│   ├── smartHighlighter.ts  # AI categorization
│   ├── pdfGenerator.ts      # PDF generation
│   ├── supabase.ts          # Supabase client
│   └── utils.ts             # Utility functions
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── styles/              # Global styles
```

### Adding New Features

1. **New Conversation Format**: Extend `ConversationParser` class
2. **New PDF Template**: Add to `PDFGenerator.getDefaultTemplates()`
3. **New Export Format**: Implement in `PDFGenerator` or create new export utility
4. **UI Components**: Use Shadcn/ui components for consistency

### Testing
```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 🌟 Roadmap

### Phase 1 (Current)
- ✅ Multi-format conversation parsing
- ✅ AI-powered categorization
- ✅ PDF generation with templates
- ✅ Dark/light mode toggle

### Phase 2 (Next)
- 🔄 Supabase integration for data persistence
- 🔄 User authentication and profiles
- 🔄 Conversation history and management
- 🔄 Enhanced PDF templates

### Phase 3 (Future)
- 📋 Collaborative highlighting
- 📋 Semantic search capabilities
- 📋 Browser extension
- 📋 Multiple export formats
- 📋 Conversation threading

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/llms_to_pdf/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/llms_to_pdf/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/llms_to_pdf/wiki)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- PDF generation with [Puppeteer](https://pptr.dev/)
- AI processing with [OpenAI](https://openai.com/)

---

**Made with ❤️ for the AI community**
