import supabase from "@/lib/supabase";
import type { Tables } from "@/lib/supabase.types";
import { Input, Textarea } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function NoteEditor({ item }: { item: Tables<"items"> }) {
	const [title, setTitle] = useState(item?.title ?? "");
	const [markdown, setMarkdown] = useState(item?.markdown ?? "");
	const queryClient = useQueryClient();

	useEffect(() => {
		if (item) {
			setTitle(item.title ?? "");
			setMarkdown(item.markdown ?? "");
		}
	}, [item]);

	const { mutate: updateItem, isPending: isSaving } = useMutation({
		mutationFn: async (updatedFields: {
			title?: string;
			markdown?: string;
			space_id?: string | null;
		}) => {
			if (!item) return;

			const { error } = await supabase
				.from("items")
				.update(updatedFields)
				.eq("id", item.id);

			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["item", item.id] });
			queryClient.invalidateQueries({ queryKey: ["items"] });
		},
	});

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

	return (
		<div className="space-y-4">
			<Input
				className="text-lg font-semibold"
				value={title}
				onValueChange={setTitle}
				placeholder="Title"
			/>
			<Textarea
				value={markdown}
				onValueChange={setMarkdown}
				placeholder="Start writing..."
			/>
			<div>{isSaving ? "Saving..." : "All changes saved."}</div>
		</div>
	);
}
