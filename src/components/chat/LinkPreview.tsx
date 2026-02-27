import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";

interface LinkPreviewProps {
  url: string;
}

const LinkPreview = ({ url }: LinkPreviewProps) => {
  const [meta, setMeta] = useState<{ title: string; description: string; image?: string; domain: string } | null>(null);

  useEffect(() => {
    try {
      const u = new URL(url);
      setMeta({
        title: u.hostname.replace("www.", ""),
        description: u.pathname.length > 1 ? u.pathname : url,
        domain: u.hostname.replace("www.", ""),
      });
    } catch {
      // invalid URL
    }
  }, [url]);

  if (!meta) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="block mt-1.5 rounded-lg border border-border/50 bg-background/50 overflow-hidden hover:bg-muted/50 transition-colors"
    >
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <ExternalLink className="h-3 w-3 text-primary flex-shrink-0" />
          <p className="text-xs font-medium text-primary truncate">{meta.domain}</p>
        </div>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{meta.description}</p>
      </div>
    </a>
  );
};

// Utility to extract URLs from text
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

// Render text with clickable links
export function renderMessageWithLinks(text: string, isMe: boolean) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  if (parts.length === 1 && !urlRegex.test(text)) {
    return <span>{text}</span>;
  }

  return (
    <>
      {parts.map((part, i) => {
        if (/(https?:\/\/[^\s]+)/.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="underline break-all"
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default LinkPreview;
