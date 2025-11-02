import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 10
export const runtime = 'nodejs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

export async function POST(request: NextRequest) {
  try {
    const { currentTutorials, instruction } = await request.json()

    if (!currentTutorials || !instruction) {
      return NextResponse.json(
        { error: 'Current tutorials and instruction are required' },
        { status: 400 }
      )
    }

    const prompt = `You are an expert technical writer. You have previously generated tutorial scaffolds, and now the user wants to refine them.

Current tutorials:
${JSON.stringify(currentTutorials.map((t: any) => t.metadata), null, 2)}

User instruction: "${instruction}"

Based on the user's instruction, modify the tutorials accordingly. You can:
- Add more detail to specific sections
- Change the focus or difficulty level
- Add or remove tutorials
- Adjust cost estimates
- Modify prerequisites or learning objectives
- Change the target audience

Return the refined tutorials in the same JSON format:
{
  "tutorials": [
    {
      "title": "Clear, action-oriented title",
      "difficulty": "Beginner|Intermediate|Advanced",
      "summary": "2-3 sentence summary explaining what developers will learn and build",
      "outline": [
        "Detailed section 1: Specific description",
        "Detailed section 2: Specific description",
        ...
      ],
      "estimatedCost": 100-500,
      "targetAudience": "Specific developer persona",
      "prerequisites": ["Specific skill 1", "Specific tool 2", ...],
      "keyTakeaways": ["Concrete skill 1", "Concrete skill 2", ...],
      "exampleProject": "Brief description of project they'll build"
    }
  ]
}

Maintain the same structure but apply the requested changes. Return only valid JSON.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert technical writer who refines tutorial content based on user feedback. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const responseText = completion.choices[0].message.content || ''

    // Try to extract JSON from markdown code blocks if present
    let jsonText = responseText
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1]
    }

    const tutorialData = JSON.parse(jsonText)

    // Generate markdown files for each tutorial (same logic as generate route)
    const markdownFiles = tutorialData.tutorials.map((tutorial: TutorialIdea) => {
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

    return NextResponse.json({
      tutorials: markdownFiles,
      csv,
      totalTutorials: markdownFiles.length,
    })
  } catch (error) {
    console.error('Refinement error:', error)
    return NextResponse.json(
      {
        error: 'Failed to refine tutorials',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
