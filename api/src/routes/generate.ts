import { Router, Request, Response } from 'express'
import OpenAI from 'openai'

const router = Router()

// Lazy initialization to ensure env vars are loaded
const getOpenAI = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

interface Page {
  url: string
  title: string
  content: string
}

interface TutorialIdea {
  title: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  summary: string
  outline: string[]
  estimatedCost: number
  targetAudience: string
  prerequisites: string[]
  keyTakeaways?: string[]
  exampleProject?: string
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { pages } = req.body

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ error: 'Pages array is required' })
    }

    // Combine all page content for analysis
    const combinedContent = pages
      .map((page: Page) => `Page: ${page.title}\nURL: ${page.url}\n${page.content}`)
      .join('\n\n---\n\n')
      .slice(0, 50000) // Limit to avoid token limits

    const prompt = `You are an expert technical writer analyzing documentation to create comprehensive tutorial scaffolds.

Below is scraped documentation content from a project. Your task is to:
1. Identify 5-10 distinct tutorial topics that would be valuable for developers
2. Focus on practical, hands-on tutorials that teach specific skills
3. Consider different difficulty levels (Beginner, Intermediate, Advanced)
4. Estimate the creation cost based on complexity ($100-$500)
5. For each tutorial, provide detailed section outlines with specific topics covered
6. Include concrete examples and code patterns that should be demonstrated

Documentation Content:
${combinedContent}

Generate tutorial ideas in the following JSON format:
{
  "tutorials": [
    {
      "title": "Clear, action-oriented title",
      "difficulty": "Beginner|Intermediate|Advanced",
      "summary": "2-3 sentence summary explaining what developers will learn and build",
      "outline": [
        "Introduction and Setup: Install tools, configure environment",
        "Core Concept: Explain main concept with real-world analogy",
        "Basic Implementation: Build first working example with code",
        "Advanced Patterns: Demonstrate best practices and optimization",
        "Common Issues: Address typical problems and solutions",
        "Production Tips: Security, performance, and deployment considerations"
      ],
      "estimatedCost": 100-500,
      "targetAudience": "Specific developer persona (e.g., Frontend developers with React experience)",
      "prerequisites": ["Specific skill 1 with version", "Specific tool 2 installed", "Concept 3 understood"],
      "keyTakeaways": ["Concrete skill 1", "Concrete skill 2", "Concrete skill 3"],
      "exampleProject": "Brief description of a real project they'll build"
    }
  ]
}

IMPORTANT: Make outlines detailed and specific. Each section should describe exactly what will be covered, not just generic headings.

Return only valid JSON, no additional text.`

    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert technical writer who creates comprehensive tutorial outlines. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      stream: false,
    })

    const responseText = completion.choices[0].message.content || ''

    // Try to extract JSON from markdown code blocks if present
    let jsonText = responseText
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1]
    }

    const tutorialData = JSON.parse(jsonText)

    // Generate markdown files for each tutorial
    const markdownFiles = tutorialData.tutorials.map((tutorial: TutorialIdea, index: number) => {
      const markdown = `# ${tutorial.title}

**Difficulty:** ${tutorial.difficulty}
**Estimated Cost:** $${tutorial.estimatedCost}
**Target Audience:** ${tutorial.targetAudience}
**llms.txt Compatible:** Yes

## Summary

${tutorial.summary}

${tutorial.exampleProject ? `## What You'll Build

${tutorial.exampleProject}

` : ''}${tutorial.keyTakeaways && tutorial.keyTakeaways.length > 0 ? `## Learning Objectives

By the end of this tutorial, you will:

${tutorial.keyTakeaways.map((takeaway) => `- ${takeaway}`).join('\n')}

` : ''}## Prerequisites

${tutorial.prerequisites.map((p) => `- ${p}`).join('\n')}

## Tutorial Outline

${tutorial.outline.map((section, i) => `${i + 1}. ${section}`).join('\n')}

## Detailed Implementation

${tutorial.outline.map((section, i) => {
  const sectionTitle = section.split(':')[0] || section
  const sectionDesc = section.split(':')[1] || ''

  return `### ${i + 1}. ${sectionTitle}

${sectionDesc.trim()}

\`\`\`typescript
// Example implementation for ${sectionTitle}
// This is a scaffold - expand with actual code based on the documentation

interface Config {
  // Define your configuration
}

async function ${sectionTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}(config: Config) {
  // Implement the functionality described in: ${section}

  return {
    success: true,
    data: {}
  }
}
\`\`\`

**Recommended Approach:**
- Start with the basic implementation shown above
- Test each step before moving to the next
- Refer to the official documentation for specific API details
- Use TypeScript for better type safety and developer experience

**Common Patterns:**
- Error handling with try-catch blocks
- Async/await for asynchronous operations
- Configuration validation before execution
- Logging for debugging and monitoring

`}).join('\n')}

## Best Practices

1. **Code Organization:** Structure your code into modular, reusable components
2. **Error Handling:** Implement comprehensive error handling and user feedback
3. **Testing:** Write unit tests for critical functionality
4. **Documentation:** Comment complex logic and maintain API documentation
5. **Performance:** Optimize for performance and scalability from the start
6. **Security:** Follow security best practices and validate all inputs

## Troubleshooting

### Common Issues

1. **Issue:** Configuration not loading correctly
   - **Solution:** Verify file paths and environment variables
   - **Prevention:** Use absolute paths and validate configs at startup

2. **Issue:** Unexpected behavior in production
   - **Solution:** Check environment-specific settings and logs
   - **Prevention:** Maintain separate configs for dev/staging/prod

3. **Issue:** Performance degradation
   - **Solution:** Profile the application and identify bottlenecks
   - **Prevention:** Implement caching and lazy loading where appropriate

## Next Steps

- [ ] Implement the tutorial code with real examples from the documentation
- [ ] Add screenshots and visual guides for complex steps
- [ ] Include video walkthrough for visual learners
- [ ] Create accompanying GitHub repository with starter code
- [ ] Add exercises and challenges for hands-on practice
- [ ] Gather feedback from beta testers and iterate

## Additional Resources

- Official documentation (refer to scraped source)
- Community forums and support channels
- Related tutorials and learning paths
- Example projects and templates

---
`

      const stopWords = new Set(['the', 'with', 'for', 'and', 'your', 'how', 'using', 'from', 'into'])
      const filename = tutorial.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]+/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word))
        .slice(0, 2)
        .join('-') || tutorial.title.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 10)

      return {
        filename: `${filename}.md`,
        content: markdown,
        metadata: tutorial,
      }
    })

    // Generate CSV index
    const csvHeader = 'Title,Difficulty,Estimated Cost,Target Audience,Filename\n'
    const csvRows = markdownFiles
      .map(
        (file: any) =>
          `"${file.metadata.title}","${file.metadata.difficulty}","$${file.metadata.estimatedCost}","${file.metadata.targetAudience}","${file.filename}"`
      )
      .join('\n')
    const csv = csvHeader + csvRows

    // Return JSON response
    return res.json({
      tutorials: markdownFiles,
      csv,
      totalTutorials: markdownFiles.length,
    })
  } catch (error) {
    console.error('Generation error:', error)
    return res.status(500).json({
      error: 'Failed to generate tutorials',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
