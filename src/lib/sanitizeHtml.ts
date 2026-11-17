/**
 * Allowlist HTML sanitizer for rich email/quote previews rendered with dangerouslySetInnerHTML.
 * Uses an inert DOMParser document (does not execute scripts or fetch resources) and keeps only safe
 * structural/formatting tags and http(s)/mailto links without inline styles or event handlers.
 */

const ALLOWED_TAGS = new Set([
  "P", "DIV", "SPAN", "BR", "HR", "B", "STRONG", "I", "EM", "U", "S",
  "H1", "H2", "H3", "H4", "UL", "OL", "LI", "BLOCKQUOTE", "A",
  "TABLE", "THEAD", "TBODY", "TR", "TH", "TD",
]);

const DROP_CONTENT = new Set([
  "SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "TEMPLATE", "NOSCRIPT", "SVG", "MATH", "HEAD", "TITLE",
]);

/** Allow only http(s) and mailto URLs after stripping ASCII control characters and spaces. */
export function safeHref(value: string | null | undefined): string | null {
  if (!value) return null;
  // eslint-disable-next-line no-control-regex
  const compact = value.trim().replace(/[\u0000-\u0020\u007f]/g, "").toLowerCase();
  return /^(https?:\/\/|mailto:)/.test(compact) ? value.trim() : null;
}

function copyClean(from: Node, to: Node, doc: Document): void {
  from.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      to.appendChild(doc.createTextNode(node.textContent ?? ""));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toUpperCase();
    if (DROP_CONTENT.has(tag)) return;
    if (!ALLOWED_TAGS.has(tag)) {
      copyClean(el, to, doc);
      return;
    }
    const clean = doc.createElement(tag.toLowerCase());
    if (tag === "A") {
      const href = safeHref(el.getAttribute("href"));
      if (href) {
        clean.setAttribute("href", href);
        clean.setAttribute("rel", "noopener noreferrer");
        clean.setAttribute("target", "_blank");
      }
    }
    copyClean(el, clean, doc);
    to.appendChild(clean);
  });
}

/** Sanitize untrusted HTML string into safe markup for quote/email preview rendering. */
export function sanitizeHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const out = document.implementation.createHTMLDocument("");
  const container = out.createElement("div");
  copyClean(parsed.body, container, out);
  return container.innerHTML;
}
