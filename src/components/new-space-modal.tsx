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
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export default function NewSpaceModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const { mutate: createSpace, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("spaces")
        .insert({
          name,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      navigate({ to: `/spaces/${data.id}` });
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
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      hideCloseButton
      backdrop="blur"
    >
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
