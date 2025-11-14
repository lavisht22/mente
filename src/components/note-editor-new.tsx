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
