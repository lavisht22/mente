import supabase from "@/lib/supabase";
import type { Tables } from "@/lib/supabase.types";
import { Crepe } from "@milkdown/crepe";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import "@/milkdown-theme.css";

export default function NoteEditor({ item }: { item: Tables<"items"> }) {
	const [title, setTitle] = useState(item?.title ?? "");
	const [markdown, setMarkdown] = useState(item?.markdown ?? "");
	const editorRef = useRef<HTMLDivElement>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const crepeRef = useRef<Crepe | null>(null);
	const isUpdatingFromEditor = useRef(false);
	const currentItemId = useRef<string | null>(null);
	const queryClient = useQueryClient();

	useEffect(() => {
		if (item) {
			if (titleRef.current && document.activeElement !== titleRef.current) {
				setTitle(item.title ?? "");
			}

			// Only update markdown if it's not coming from the editor itself
			if (!isUpdatingFromEditor.current) {
				setMarkdown(item.markdown ?? "");
			}
		}
	}, [item]);

	const { mutate: updateItem } = useMutation({
		mutationFn: async (updatedFields: {
			title?: string;
			markdown?: string;
		}) => {
			if (!item) return;

			const { error } = await supabase
				.from("items")
				.update(updatedFields)
				.eq("id", item.id);

			if (error) throw error;
		},
		onSuccess: () => {
			// Don't invalidate the specific item query to prevent re-render
			queryClient.invalidateQueries({ queryKey: ["items"] });
		},
	});

	useEffect(() => {
		if (!editorRef.current || !item) return;

		// Only re-initialize if the item ID has changed
		if (currentItemId.current === item.id && crepeRef.current) {
			return;
		}

		const initEditor = async () => {
			console.log("Initializing Crepe editor for item:", item.id);

			const crepe = new Crepe({
				root: editorRef.current,
				defaultValue: item.markdown || "",
				features: {
					[Crepe.Feature.CodeMirror]: true,
					[Crepe.Feature.ListItem]: true,
					[Crepe.Feature.LinkTooltip]: true,
					[Crepe.Feature.ImageBlock]: true,
					[Crepe.Feature.BlockEdit]: true,
					[Crepe.Feature.Table]: true,
					[Crepe.Feature.Toolbar]: true,
					[Crepe.Feature.Cursor]: true,
					[Crepe.Feature.Placeholder]: true,
				},
			});

			crepeRef.current = crepe;
			currentItemId.current = item.id;

			await crepe.create();

			// Set up event listeners
			crepe.on((listener) => {
				listener.markdownUpdated((_ctx, newMarkdown: string) => {
					isUpdatingFromEditor.current = true;
					setMarkdown(newMarkdown);
					setTimeout(() => {
						isUpdatingFromEditor.current = false;
					}, 100);
				});
			});
		};

		initEditor();

		return () => {
			if (crepeRef.current) {
				crepeRef.current.destroy();
				crepeRef.current = null;
			}

			if (editorRef.current) {
				editorRef.current.innerHTML = "";
			}
		};
	}, [item]);

	useEffect(() => {
		const handler = setTimeout(() => {
			if (!item) return;
			if (title !== item.title || markdown !== item.markdown) {
				updateItem({ title, markdown });
			}
		}, 500);

		return () => {
			clearTimeout(handler);
		};
	}, [title, markdown, item, updateItem]);

	useEffect(() => {
		if (titleRef.current && titleRef.current.textContent !== title) {
			titleRef.current.textContent = title;
		}
	}, [title]);

	const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
		if (e.key === "Enter" || e.key === "ArrowDown") {
			e.preventDefault();
			const editorElement = editorRef.current?.querySelector(
				".milkdown-editor",
			) as HTMLElement | null;
			editorElement?.focus();
		}
	};

	return (
		<div className="space-y-4 max-w-3xl mx-auto">
			<h1
				ref={titleRef}
				contentEditable
				suppressContentEditableWarning
				onInput={(e) => setTitle(e.currentTarget.textContent ?? "")}
				onKeyDown={handleTitleKeyDown}
				className="text-[42px] font-bold outline-none focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
				data-placeholder="Title"
				aria-label="Note title"
			/>
			<div ref={editorRef} className="w-full" />
		</div>
	);
}
