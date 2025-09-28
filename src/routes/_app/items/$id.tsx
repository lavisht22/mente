import {
	Button,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	Textarea,
} from "@heroui/react";
import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import supabase from "@/lib/supabase";
import { LucideX } from "lucide-react";

export const Route = createFileRoute("/_app/items/$id")({
	component: RouteComponent,
});

const itemQuery = (id: string) =>
	queryOptions({
		queryKey: ["item", id],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("items")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;

			return data;
		},
	});

function RouteComponent() {
	const { id } = Route.useParams();
	const { data: item } = useQuery(itemQuery(id));
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [title, setTitle] = useState(item?.title ?? "");
	const [markdown, setMarkdown] = useState(item?.markdown ?? "");

	useEffect(() => {
		if (item) {
			setTitle(item.title ?? "");
			setMarkdown(item.markdown ?? "");
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
			queryClient.invalidateQueries({ queryKey: ["item", id] });
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
		<Modal
			backdrop="blur"
			isOpen
			onOpenChange={() => navigate({ to: ".." })}
			hideCloseButton
		>
			<ModalContent>
				<ModalHeader className="flex justify-between items-center gap-4">
					<div>Item</div>

					<div>
						<Button variant="flat" isIconOnly>
							<LucideX className="size-4" />
						</Button>
					</div>
				</ModalHeader>
				<ModalBody>
					<Input
						className="text-lg font-semibold"
						value={title}
						onValueChange={setTitle}
						placeholder="Item Title"
					/>
					<Textarea
						value={markdown}
						onValueChange={setMarkdown}
						placeholder="Start writing..."
						className="h-96"
					/>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
