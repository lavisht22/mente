import { spaceUsersQuery, usersQuery } from "@/lib/queries";
import supabase from "@/lib/supabase";
import {
  Avatar,
  Button,
  Divider,
  Listbox,
  ListboxItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  addToast,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LucideChevronDown } from "lucide-react";

interface SpaceMembersDialogProps {
  space_id: string;
}

function AddUsers({
  existing,
  space_id,
}: { existing: string[]; space_id: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery(usersQuery);

  if (isLoading || isError || !data) {
    return null;
  }

  const addUserMutation = useMutation({
    mutationFn: async (user_id: string) => {
      const { error } = await supabase.from("space_user").insert({
        space_id,
        user_id,
        role: "reader",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(spaceUsersQuery(space_id));
    },
    onError: () => {
      addToast({
        title: "Error",
        description: "Failed to add user to space.",
        color: "danger",
      });
    },
  });

  return (
    <div className="flex flex-col gap-2 w-full">
      {data
        .filter((user) => !existing.includes(user.id))
        .map((user) => (
          <Button
            key={user.id}
            className="px-2 h-12"
            variant="light"
            startContent={
              <Avatar
                size="sm"
                src={`https://api.dicebear.com/9.x/glass/svg?seed=${user.user_id}`}
                fallback="?"
              />
            }
            endContent={
              <div className="text-default-500 flex items-center bg-default-100 px-2 py-1 rounded-medium">
                <p className="text-xs">ADD</p>
              </div>
            }
            onPress={() => addUserMutation.mutate(user.id)}
            isDisabled={addUserMutation.isPending}
          >
            <div className="flex-1">
              <p className="text-left text-base">
                {user.name || "Unknown User"}
              </p>
            </div>
          </Button>
        ))}
    </div>
  );
}

export default function SpaceMembersDialog({
  space_id,
}: SpaceMembersDialogProps) {
  const { data, isLoading, isError } = useQuery(spaceUsersQuery(space_id));

  if (isLoading || isError || !data) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="light">Share</Button>
      </PopoverTrigger>
      <PopoverContent className="p-4 min-w-96 space-y-4">
        <div className="flex flex-col gap-2 w-full">
          {data.map((spaceUser) => (
            <Popover key={spaceUser.user_id} placement="bottom-end">
              <PopoverTrigger>
                <Button
                  className="px-2 h-12"
                  variant="light"
                  startContent={
                    <Avatar
                      size="sm"
                      src={`https://api.dicebear.com/9.x/glass/svg?seed=${spaceUser.user_id}`}
                      fallback="?"
                    />
                  }
                  endContent={
                    <div className="text-default-500 flex items-center bg-default-100 px-2 py-1 rounded-medium">
                      <p className="text-xs text-default-500">
                        {spaceUser.role.toUpperCase()}
                      </p>
                      <LucideChevronDown className="size-4" />
                    </div>
                  }
                >
                  <div className="flex-1">
                    <p className="text-left text-base">
                      {spaceUser.users.name || "Unknown User"}
                    </p>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2">
                <Listbox>
                  <ListboxItem
                    title="Admin"
                    description="Read, create, edit, and add other members"
                  />
                  <ListboxItem
                    title="Writer"
                    description="Read, create and edit access"
                  />
                  <ListboxItem title="Reader" description="Read only access" />
                </Listbox>
              </PopoverContent>
            </Popover>
          ))}
        </div>
        <Divider />
        <AddUsers space_id={space_id} existing={data.map((su) => su.user_id)} />
      </PopoverContent>
    </Popover>
  );
}
