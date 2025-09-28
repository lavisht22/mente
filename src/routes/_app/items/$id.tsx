import {
	Button,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	Select,
	SelectItem,
	Textarea,
} from "@heroui/react";
import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { spacesQuery } from "@/lib/queries";
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

	const { history } = useRouter();
	const { data: item } = useQuery(itemQuery(id));
	const { data: spaces } = useQuery(spacesQuery);
	const queryClient = useQueryClient();

	const [title, setTitle] = useState(item?.title ?? "");
	const [markdown, setMarkdown] = useState(item?.markdown ?? "");
	const [spaceId, setSpaceId] = useState<string | null>(item?.space_id ?? null);

	useEffect(() => {
		if (item) {
			setTitle(item.title ?? "");
			setMarkdown(item.markdown ?? "");
			setSpaceId(item.space_id ?? null);
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
			queryClient.invalidateQueries({ queryKey: ["item", id] });
			queryClient.invalidateQueries({ queryKey: ["items"] });
		},
	});

	useEffect(() => {
		const handler = setTimeout(() => {
			if (!item) return;
			if (
				title !== item.title ||
				markdown !== item.markdown ||
				spaceId !== item.space_id
			) {
				updateItem({ title, markdown, space_id: spaceId });
			}
		}, 500);

		return () => {
			clearTimeout(handler);
		};
	}, [title, markdown, spaceId, item, updateItem]);

	return (
		<Modal
			backdrop="blur"
			isOpen
			onOpenChange={() => !isSaving && history.go(-1)}
			hideCloseButton
		>
			<ModalContent>
				<ModalHeader className="flex justify-between items-center gap-4">
					<Select
						placeholder="Space"
						selectedKeys={spaceId ? [spaceId] : []}
						onSelectionChange={(keys) =>
							setSpaceId(Array.from(keys)[0] as string)
						}
					>
						{(spaces ?? []).map((space) => (
							<SelectItem key={space.id}>{space.name}</SelectItem>
						))}
					</Select>

					<div>
						<Button
							variant="flat"
							isIconOnly
							isLoading={isSaving}
							onPress={() => history.go(-1)}
						>
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
