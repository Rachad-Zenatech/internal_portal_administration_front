interface LinkifiedTextProps {
  text?: string | null;
  className?: string;
}

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<]+/gi;

export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  if (!text) return null;

  const content: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = URL_PATTERN.exec(text)) !== null) {
    const rawUrl = match[0];
    const url = rawUrl.replace(/[.,!?;:]+$/, "");
    if (!url) continue;

    const urlEnd = match.index + url.length;
    if (match.index > lastIndex) {
      content.push(text.slice(lastIndex, match.index));
    }

    const href = url.startsWith("www.") ? `https://${url}` : url;
    content.push(
      <a
        key={`link-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline decoration-blue-400 underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        {url}
      </a>,
    );

    if (urlEnd < match.index + rawUrl.length) {
      content.push(rawUrl.slice(url.length));
    }
    lastIndex = match.index + rawUrl.length;
  }

  if (lastIndex < text.length) {
    content.push(text.slice(lastIndex));
  }

  return <span className={className}>{content}</span>;
}
