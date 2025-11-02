export function MarkdownTitle({ title }: { title: string }) {
  const match = title.match(/^(#+)\s+(.+)$/)
  if (match) {
    const [, hashes, titleText] = match
    return (
      <div className="pl-2 text-sm">
        <span className="text-black/40">{hashes} </span>
        <span className="text-black/90 font-bold">{titleText}</span>
      </div>
    )
  }
  return (
    <div className="pl-2 text-sm">
      <span className="text-black/40"># </span>
      <span className="text-black/90 font-bold">{title}</span>
    </div>
  )
}
