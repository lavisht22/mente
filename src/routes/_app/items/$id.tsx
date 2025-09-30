import { Button, Select, SelectItem } from "@heroui/react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { spacesQuery } from "@/lib/queries";
import supabase from "@/lib/supabase";
import { LucideEllipsisVertical } from "lucide-react";
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
		<div>
			<div id="header" className="p-4 flex justify-between items-center gap-4">
				<div className="flex-1">
					<Select
						variant="bordered"
						color="primary"
						className="w-full max-w-40"
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
				</div>

				<div>
					<Button variant="light" isIconOnly onPress={() => history.go(-1)}>
						<LucideEllipsisVertical className="size-4" />
					</Button>
				</div>
			</div>
			<div className="p-8">
				{item?.type === "note" && <NoteEditor item={item} />}
			</div>
		</div>
	);
}
