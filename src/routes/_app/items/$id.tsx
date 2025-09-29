import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	Select,
	SelectItem,
} from "@heroui/react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { spacesQuery } from "@/lib/queries";
import supabase from "@/lib/supabase";
import { LucideX } from "lucide-react";
import NoteEditor from "./-components/note-editor";

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

	const [spaceId, setSpaceId] = useState<string | null>(item?.space_id ?? null);

	useEffect(() => {
		if (item) {
			setSpaceId(item.space_id ?? null);
		}
	}, [item]);

	return (
		<Modal
			backdrop="blur"
			isOpen
			onOpenChange={() => history.go(-1)}
			hideCloseButton
			scrollBehavior="inside"
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
						<Button variant="flat" isIconOnly onPress={() => history.go(-1)}>
							<LucideX className="size-4" />
						</Button>
					</div>
				</ModalHeader>
				<ModalBody>
					{item?.type === "note" && <NoteEditor item={item} />}
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
