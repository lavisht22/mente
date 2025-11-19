import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import supabase from "@/lib/supabase";
import SupabaseProvider from "@/lib/y-supabase";
import { BlockNoteEditor } from "@blocknote/core";
import type { Tables } from "db.types";
import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import "@/bn-theme.css";
import { userQuery } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

// Simple deterministic hash -> HSL color so the same user is always the same color
const getUserColor = (identifier: string | null | undefined): string => {
  const base = identifier ?? "anonymous";

  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    // Basic string hash
    hash = (hash * 31 + base.charCodeAt(i)) | 0;
  }

  // Map hash to a hue on the color wheel
  const hue = Math.abs(hash) % 360;
  const saturation = 70; // keep reasonably vibrant
  const lightness = 80;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const uploadFileToStorage = async (
  file: File,
  itemId: string,
): Promise<string> => {
  const id = nanoid();

  const { data, error } = await supabase.storage
    .from("items")
    .upload(`${itemId}/${id}-${file.name}`, file);

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Upload failed");
  }

  return `storage://${data.path}`; // Custom URL scheme to identify storage files
};

export default function NoteEditor({ item }: { item: Tables<"items"> }) {
  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);
  const { data: user } = useQuery(userQuery);

  const getMarkdown = useRef<() => string>(() => {
    if (!editor) {
      return "";
    }
    return editor.blocksToMarkdownLossy();
  });

  useEffect(() => {
    const doc = new Y.Doc();

    const provider = new SupabaseProvider(doc, supabase, {
      channel: item.id,
      resyncInterval: 60 * 1000, // 1 minute

      load: async () => {
        const { data, error } = await supabase
          .from("items")
          .select("ydoc")
          .eq("id", item.id)
          .single();

        if (error) {
          console.error("Failed to load note", error);
          return null;
        }

        return data?.ydoc ? Uint8Array.from(data.ydoc) : null;
      },
      save: async (content) => {
        const { error } = await supabase
          .from("items")
          .update({
            ydoc: Array.from(content),
            markdown: getMarkdown.current(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (error) {
          console.error("Failed to save note", error);
        }
      },
    });

    const editor = BlockNoteEditor.create({
      collaboration: {
        fragment: doc.getXmlFragment("document-store"),
        provider,
        user: {
          name: user?.name ?? "Unknown User",
          color: getUserColor(user?.id ?? user?.name ?? null),
        },
        showCursorLabels: "activity",
      },

      uploadFile: (file: File, _blockId?: string) => {
        return uploadFileToStorage(file, item.id);
      },
      resolveFileUrl: async (url: string) => {
        // Convert custom URL scheme to public URL
        if (url.startsWith("storage://")) {
          const path = url.replace("storage://", "");

          const { data, error } = await supabase.storage
            .from("items")
            .createSignedUrl(path, 60);

          if (error) {
            throw error;
          }

          return data.signedUrl;
        }

        return url;
      },
    });

    setEditor(editor);
    getMarkdown.current = () => {
      const markdown = editor.blocksToMarkdownLossy(editor.document);
      return markdown;
    };

    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, [item.id, user?.id, user?.name]);

  if (!editor) {
    return null;
  }

  return (
    <BlockNoteView
      className="prose prose-h1:!text-3xl prose-h1:!font-medium prose-h2:!text-2xl prose-h2:!font-medium prose-h3:!text-xl prose-h3:!font-medium"
      editor={editor}
      data-custom
    />
  );
}
