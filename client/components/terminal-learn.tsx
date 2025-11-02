import { MarkdownTitle } from './markdown-title'
import { Output } from './output'
import { CodeBlock } from './code-block'
import { BlockSpacer } from './block-spacer'

export function TerminalLearn() {
  return (
    <div>
      <MarkdownTitle title="# Learn" />
      <MarkdownTitle title="## Entry & Convention" />
      <Output>Files in src/ folder match export names in package.json:</Output>
      <CodeBlock>
        {`+--------------------------+---------------------+\n| File                     | Export Name         |\n+--------------------------+---------------------+\n| src/index.ts             | "." (default)       |\n| src/lite.ts              | "./lite"            |\n| src/react/index.ts       | "./react"           |\n+--------------------------+---------------------+`}
      </CodeBlock>
      <BlockSpacer />
      <MarkdownTitle title="## Directives" />
      <Output>
        {`Bunchee can manage multiple directives such as "use client", "use server", or "use cache" and automatically split your code into different chunks and preserve the directives properly.`}
      </Output>
    </div>
  )
}
