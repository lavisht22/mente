import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import ConfirmationDialog from "@/components/confirmation-dialog";

import type { Tables } from "@/../../db.types";
import NoteEditor from "@/components/note-editor";
import { spacesQuery } from "@/lib/queries";
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
  const { data: spaces } = useQuery(spacesQuery);

  const [spaceId, setSpaceId] = useState<string | null>(item?.space_id ?? null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const updateSpaceMutation = useMutation({
    mutationFn: async (newSpaceId: string) => {
      const { error } = await supabase
        .from("items")
        .update({ space_id: newSpaceId })
        .eq("id", itemId);

      if (error) throw error;
    },
    onMutate: async (newSpaceId) => {
      // Snapshot the previous value for rollback
      const previousItem = queryClient.getQueryData<Tables<"items">>([
        "item",
        itemId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["item", itemId],
        (old: Tables<"items"> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            space_id: newSpaceId,
          };
        },
      );

      return { previousItem };
    },
    onError: (_err, _newSpaceId, context) => {
      // Rollback to previous value on error
      if (context?.previousItem) {
        queryClient.setQueryData(["item", itemId], context.previousItem);
        setSpaceId(context.previousItem.space_id);
      }
    },
  });

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

  useEffect(() => {
    if (item) {
      setSpaceId(item.space_id ?? null);
    }
  }, [item]);

  const handleSpaceChange = (keys: "all" | Set<React.Key>) => {
    const newSpaceId = Array.from(keys)[0] as string;
    setSpaceId(newSpaceId);
    updateSpaceMutation.mutate(newSpaceId);
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
          <Select
            variant="bordered"
            color="primary"
            className="w-full max-w-40"
            placeholder="Space"
            selectedKeys={spaceId ? [spaceId] : []}
            onSelectionChange={handleSpaceChange}
          >
            {(spaces ?? []).map((space) => (
              <SelectItem key={space.id}>{space.name}</SelectItem>
            ))}
          </Select>
          <Dropdown backdrop="blur">
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
        {item?.type === "note" && <NoteEditor item={item} />}
      </div>

      <ConfirmationDialog
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
