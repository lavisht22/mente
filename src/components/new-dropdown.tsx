import supabase from "@/lib/supabase";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  addToast,
  useDisclosure,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LucideNotebookPen } from "lucide-react";
import { useMemo } from "react";

export default function NewDropdown({
  trigger,
  spaceId,
}: { trigger?: React.ReactNode; spaceId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { isOpen, onOpenChange } = useDisclosure();

  const { mutate: createNote } = useMutation({
    mutationFn: async () => {
      const { data: createdNote, error } = await supabase
        .from("items")
        .insert({
          space_id: spaceId,
          type: "note",
        })
        .select()
        .single();

      if (error) throw error;

      if (createdNote) {
        navigate({
          to: "/spaces/$spaceId/items/$itemId",
          params: { itemId: createdNote.id, spaceId: spaceId },
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
        icon: LucideNotebookPen,
        shortcut: "N",
        onPress: () => createNote(),
      },
    ],
    [createNote],
  );

  return (
    <>
      <Popover
        size="lg"
        backdrop="blur"
        classNames={{
          backdrop: "bg-background/70",
        }}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <PopoverTrigger>{trigger}</PopoverTrigger>
        <PopoverContent className="flex bg-transparent shadow-none">
          {options.map((option) => (
            <Button
              fullWidth
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
    </>
  );
}
