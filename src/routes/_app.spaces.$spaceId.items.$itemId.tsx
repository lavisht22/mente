import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  addToast,
} from "@heroui/react";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import ConfirmationModal from "@/components/confirmation-modal";

import type { Tables } from "@/../../db.types";
import NoteEditor from "@/components/note-editor-new";
import supabase from "@/lib/supabase";
import {
  LucideArrowLeft,
  LucideEllipsisVertical,
  LucideTrash,
} from "lucide-react";

export const Route = createFileRoute("/_app/spaces/$spaceId/items/$itemId")({
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
  const { itemId } = Route.useParams();

  const { history, navigate } = useRouter();
  const queryClient = useQueryClient();
  const { data: item } = useQuery(itemQuery(itemId));

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [title, setTitle] = useState(item?.title ?? "");
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setTitle(item?.title ?? "");
  }, [item]);

  useEffect(() => {
    if (titleRef.current && titleRef.current.textContent !== title) {
      titleRef.current.textContent = title;
    }
  }, [title]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("items").delete().eq("id", itemId);

      if (error) throw error;
    },
    onMutate: async () => {
      // Snapshot the previous value for rollback
      const previousItem = queryClient.getQueryData<Tables<"items">>([
        "item",
        itemId,
      ]);

      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: ["item", itemId] });

      return { previousItem };
    },
    onSuccess: () => {
      // Navigate away after successful deletion
      navigate({ to: "/" });
    },
    onError: (_err, _variables, context) => {
      // Rollback to previous value on error
      if (context?.previousItem) {
        queryClient.setQueryData(["item", itemId], context.previousItem);
      }
    },
  });

  const updateTitleMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      const { error } = await supabase
        .from("items")
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(
        ["item", itemId],
        (oldItem: Tables<"items"> | undefined) => {
          if (!oldItem) return oldItem;
          return { ...oldItem, title };
        },
      );
    },
    onError: (_err) => {
      addToast({
        title: "Error",
        description: "Failed to update title.",
        color: "danger",
      });
    },
  });

  const updateTitle = useDebouncedCallback((newTitle: string) => {
    updateTitleMutation.mutate(newTitle);
  }, 300);

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      // TODO: Move focus to editor
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-16 w-full px-2 flex justify-between items-center gap-4">
        <div>
          <Button
            size="lg"
            isIconOnly
            variant="light"
            onPress={() => history.go(-1)}
          >
            <LucideArrowLeft className="size-4" />
          </Button>
        </div>

        <div className="flex flex-1 justify-end items-center gap-2">
          <Dropdown backdrop="blur" placement="bottom-end">
            <DropdownTrigger>
              <Button size="lg" variant="light" isIconOnly>
                <LucideEllipsisVertical className="size-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem
                key="delete"
                startContent={<LucideTrash className="size-4" />}
                color="danger"
                onPress={() => setIsDeleteDialogOpen(true)}
              >
                Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      <div className="p-8 flex-1 overflow-y-auto">
        <div className="space-y-4 max-w-3xl mx-auto w-full">
          <h1
            ref={titleRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => {
              const newTitle = e.currentTarget.textContent ?? "";
              setTitle(newTitle);
              updateTitle(newTitle);
            }}
            onKeyDown={handleTitleKeyDown}
            className="text-[42px] font-weight-[400] outline-none focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
            data-placeholder="Title"
            aria-label="Note title"
          />
          {item?.type === "note" && <NoteEditor item={item} />}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
