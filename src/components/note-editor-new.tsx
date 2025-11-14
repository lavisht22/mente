import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import supabase from "@/lib/supabase";
import SupabaseProvider from "@/lib/y-supabase";
import { useCreateBlockNote } from "@blocknote/react";
import type { Tables } from "db.types";
import * as Y from "yjs";

const doc = new Y.Doc();

const provider = new SupabaseProvider(doc, supabase, {
  channel: "02f1999d-0a79-45ed-9228-84c79ec0b365",
  id: "02f1999d-0a79-45ed-9228-84c79ec0b365",
  tableName: "items",
  columnName: "ydoc",
  resyncInterval: 60 * 1000, // 1 minute
});

export default function NoteEditorNew({ item }: { item: Tables<"items"> }) {
  // Creates a new editor instance.
  const editor = useCreateBlockNote({
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

  // Renders the editor instance using a React component.
  return <BlockNoteView editor={editor} />;
}
