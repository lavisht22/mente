import { Button } from "@heroui/react";
import { LucideCheck, LucideCopy } from "lucide-react";
import { useEffect, useState } from "react";
import ShikiHighlighter from "react-shiki";

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  children?: React.ReactNode;
}

export default function CodeBlock({
  inline,
  className,
  children,
  ...props
}: CodeProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [copied]);

  const match = /language-(\w+)/.exec(className || "");
  const code = String(children).trim();

  return !inline && match ? (
    <div className="relative group/code w-full overflow-hidden">
      <ShikiHighlighter
        theme="github-dark"
        language={match[1]}
        className="w-full overflow-x-scroll"
      >
        {code}
      </ShikiHighlighter>
      <div className="absolute bottom-0 right-0 dark invisible group-hover/code:visible">
        <Button
          isIconOnly
          size="sm"
          onPress={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
          }}
        >
          {copied ? (
            <LucideCheck className="size-[14px] text-default-500" />
          ) : (
            <LucideCopy className="size-[14px] scale-x-[-1] text-default-600 " />
          )}
        </Button>
      </div>
    </div>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
}
