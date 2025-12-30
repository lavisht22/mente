import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import supabase from "@/lib/supabase";
import SupabaseProvider from "@/lib/y-supabase";
import { BlockNoteEditor } from "@blocknote/core";
import type { Tables } from "db.types";
import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import "@/bn-theme.css";
import { itemQuery, userQuery } from "@/lib/queries";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export default function NoteEditor({ itemId }: { itemId: string }) {
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);
  const { data: user } = useQuery(userQuery);
  const { data: item, isLoading: isItemLoading } = useQuery(itemQuery(itemId));
  const [initialYDoc, setInitialYDoc] = useState<Uint8Array | null>(null);

  const updateMutation = useMutation({
    mutationFn: async ({
      content,
      markdown,
    }: { content: Uint8Array; markdown: string }) => {
      const { error } = await supabase
        .from("items")
        .update({
          ydoc: Array.from(content),
          markdown,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId);

      if (error) {
        throw error;
      }

      return {
        content,
        markdown,
      };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["item", itemId], (oldItem: Tables<"items">) => {
        if (!oldItem) return oldItem;

        return {
          ...oldItem,
          ydoc: Array.from(data.content),
          markdown: data.markdown,
          updated_at: new Date().toISOString(),
        };
      });
    },
  });

  const getMarkdown = useRef<() => string>(() => {
    if (!editor) {
      return "";
    }
    return editor.blocksToMarkdownLossy();
  });

  const save = useRef((content: Uint8Array) => {
    updateMutation.mutate({
      content,
      markdown: getMarkdown.current(),
    });
  });

  useEffect(() => {
    if (!item) {
      return;
    }

    if (initialYDoc) {
      // already set
      return;
    }

    setInitialYDoc(Uint8Array.from(item.ydoc ?? []));
  }, [item, initialYDoc]);

  useEffect(() => {
    if (!initialYDoc) {
      return;
    }

    const doc = new Y.Doc();

    const provider = new SupabaseProvider(doc, supabase, {
      channel: itemId,
      resyncInterval: false,

      load: async () => {
        return initialYDoc;
      },
      save: async (content) => {
        save.current(content);
      },
    });

    const blockNoteEditor = BlockNoteEditor.create({
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
        return uploadFileToStorage(file, itemId);
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

    setEditor(blockNoteEditor);

    getMarkdown.current = () => {
      const markdown = blockNoteEditor.blocksToMarkdownLossy(
        blockNoteEditor.document,
      );

      return markdown;
    };

    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, [itemId, initialYDoc, user]);

  if (!editor || isItemLoading) {
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
