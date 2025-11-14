import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import supabase from "@/lib/supabase";
import SupabaseProvider from "@/lib/y-supabase";
import { useCreateBlockNote } from "@blocknote/react";
import type { Tables } from "db.types";
import { useEffect, useState } from "react";
import * as Y from "yjs";

function Editor({
  provider,
  doc,
}: {
  doc: Y.Doc;
  provider: SupabaseProvider;
}) {
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

  return <BlockNoteView editor={editor} />;
}

export default function NoteEditor({ item }: { item: Tables<"items"> }) {
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<SupabaseProvider | null>(null);

  useEffect(() => {
    const doc = new Y.Doc();

    const newProvider = new SupabaseProvider(doc, supabase, {
      channel: item.id,
      id: item.id,
      tableName: "items",
      columnName: "ydoc",
      resyncInterval: 60 * 1000, // 1 minute
    });

    setDoc(doc);
    setProvider(newProvider);

    return () => {
      newProvider.destroy();
      doc.destroy();
    };
  }, [item.id]);

  if (!provider || !doc) {
    return null;
  }

  return <Editor doc={doc} provider={provider} />;
}
