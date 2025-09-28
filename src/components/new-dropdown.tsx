import { spacesQuery } from "@/lib/queries";
import supabase from "@/lib/supabase";
import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	addToast,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { NotebookPen } from "lucide-react";
import { useMemo } from "react";

export default function NewDropdown({
	trigger,
}: { trigger?: React.ReactNode }) {
	const navigate = useNavigate();
	const { data: spaces } = useQuery(spacesQuery);
	const queryClient = useQueryClient();

	const { mutate: createNote } = useMutation({
		mutationFn: async () => {
			if (!spaces || spaces.length === 0) return;

			const { data: createdNote, error } = await supabase
				.from("items")
				.insert({
					space_id: spaces[0].id,
					type: "note",
				})
				.select()
				.single();

			if (error) throw error;

			if (createdNote) {
				navigate({
					to: "/items/$id",
					params: { id: createdNote.id },
				});
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["items"] });
		},
		onError: (error) => {
			addToast({
				title: "Error",
				description: error.message,
				color: "danger",
			});
		},
	});

	const options = useMemo(
		() => [
			{
				label: "Note",
				icon: NotebookPen,
				shortcut: "N",
				onPress: () => createNote(),
			},
		],
		[createNote],
	);

	return (
		<Popover
			size="lg"
			backdrop="blur"
			classNames={{
				backdrop: "bg-background/50",
			}}
		>
			<PopoverTrigger>{trigger}</PopoverTrigger>
			<PopoverContent className="flex bg-transparent shadow-none">
				{options.map((option) => (
					<Button
						key={option.label}
						size="lg"
						variant="light"
						className="h-full p-4"
						endContent={
							<div className="p-3 bg-default-200 rounded-full">
								<option.icon className="size-5" />
							</div>
						}
						onPress={option.onPress}
					>
						{option.label}
					</Button>
				))}
			</PopoverContent>
		</Popover>
	);
}
