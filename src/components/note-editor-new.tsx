// import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import supabase from "@/lib/supabase";
import SupabaseProvider from "@/lib/y-supabase";
import { BlockNoteEditor } from "@blocknote/core";
import type { Tables } from "db.types";
import { useEffect, useState } from "react";
import * as Y from "yjs";
import "@/bn-theme.css";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

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

  useEffect(() => {
    const doc = new Y.Doc();

    const provider = new SupabaseProvider(doc, supabase, {
      channel: item.id,
      id: item.id,
      tableName: "items",
      columnName: "ydoc",
      resyncInterval: 60 * 1000, // 1 minute
    });

    const editor = BlockNoteEditor.create({
      collaboration: {
        fragment: doc.getXmlFragment("document-store"),
        provider,
        user: {
          name: "Lavish",
          color: "#ff4500",
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

    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, [item.id]);

  if (!editor) {
    return null;
  }

  return <BlockNoteView editor={editor} data-custom />;
}
