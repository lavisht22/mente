import supabase from "@/lib/supabase";
import {
	Button,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	addToast,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function NewSpaceModal({
	isOpen,
	onOpenChange,
}: {
	isOpen: boolean;
	onOpenChange: () => void;
}) {
	const queryClient = useQueryClient();
	const [name, setName] = useState("");

	const { mutate: createSpace, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const { data: user } = await supabase.auth.getClaims();

			if (!user) {
				return;
			}

			const { error } = await supabase
				.from("spaces")
				.insert({
					name,
					user_id: user.claims.sub,
				})
				.select()
				.single();

			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["spaces"] });
			onOpenChange();
		},
		onError: (error) => {
			addToast({
				title: "Error",
				description: error.message,
				color: "danger",
			});
		},
	});

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange} hideCloseButton>
			<ModalContent>
				<ModalHeader>Create New Space</ModalHeader>
				<ModalBody>
					<Input
						autoFocus
						size="lg"
						color="primary"
						variant="bordered"
						placeholder="Give it a name"
						value={name}
						onValueChange={setName}
					/>
				</ModalBody>
				<ModalFooter>
					<Button variant="light">Cancel</Button>
					<Button
						color="primary"
						onPress={() => createSpace()}
						isLoading={isCreating}
					>
						Create
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
