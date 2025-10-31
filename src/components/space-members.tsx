import { avatarURL } from "@/lib/avatar";
import { spaceUsersQuery, usersQuery } from "@/lib/queries";
import supabase from "@/lib/supabase";
import {
  Avatar,
  AvatarGroup,
  Button,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  addToast,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LucideChevronDown } from "lucide-react";
import { useMemo } from "react";

function AddUsers({
  existing,
  space_id,
}: { existing: string[]; space_id: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery(usersQuery);

  const availableUsers = useMemo(() => {
    if (!data) return [];
    return data.filter((user) => !existing.includes(user.id));
  }, [data, existing]);

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

  if (isLoading || isError || !data) {
    return null;
  }

  if (availableUsers.length === 0) {
    return null;
  }

  return (
    <>
      <Divider />
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
                  src={avatarURL(user.id)}
                  fallback={avatarURL("?")}
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
    </>
  );
}

interface SpaceMembersDialogProps {
  space_id: string;
}

export default function SpaceMembers({ space_id }: SpaceMembersDialogProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery(spaceUsersQuery(space_id));

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({
      user_id,
      role,
    }: {
      user_id: string;
      role: "admin" | "writer" | "reader";
    }) => {
      const { error } = await supabase
        .from("space_user")
        .update({ role })
        .eq("space_id", space_id)
        .eq("user_id", user_id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate space users query to refetch updated roles
      queryClient.invalidateQueries(spaceUsersQuery(space_id));
    },
    onError: () => {
      addToast({
        title: "Error",
        description: "Failed to update user role.",
        color: "danger",
      });
    },
  });

  if (isLoading || isError || !data) {
    return null;
  }

  return (
    <Popover backdrop="blur" placement="bottom-end">
      <PopoverTrigger>
        <button
          className="h-12 flex justify-center items-center px-3"
          type="button"
        >
          <AvatarGroup>
            {data.map((spaceUser) => (
              <Avatar
                isBordered
                key={spaceUser.user_id}
                size="sm"
                src={avatarURL(spaceUser.user_id)}
                fallback={avatarURL("?")}
              />
            ))}
          </AvatarGroup>
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-4 min-w-96 space-y-4">
        <div className="flex flex-col gap-2 w-full">
          {data.map((spaceUser) => (
            <Dropdown
              key={spaceUser.user_id}
              placement="bottom-end"
              backdrop="blur"
            >
              <DropdownTrigger>
                <Button
                  className="px-2 h-12"
                  variant="light"
                  startContent={
                    <Avatar
                      size="sm"
                      src={avatarURL(spaceUser.user_id)}
                      fallback={avatarURL("?")}
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
              </DropdownTrigger>
              <DropdownMenu className="p-2" disabledKeys={["remove"]}>
                <DropdownItem
                  key="admin"
                  title="Admin"
                  description="Read, create, edit, and add other members"
                  onPress={() =>
                    updateUserRoleMutation.mutate({
                      user_id: spaceUser.user_id,
                      role: "admin",
                    })
                  }
                />
                <DropdownItem
                  key="writer"
                  title="Writer"
                  description="Read, create and edit access"
                  onPress={() =>
                    updateUserRoleMutation.mutate({
                      user_id: spaceUser.user_id,
                      role: "writer",
                    })
                  }
                />
                <DropdownItem
                  key="reader"
                  title="Reader"
                  description="Read only access"
                  onPress={() =>
                    updateUserRoleMutation.mutate({
                      user_id: spaceUser.user_id,
                      role: "reader",
                    })
                  }
                />
                <DropdownItem
                  key="remove"
                  title="Remove"
                  description="Remove user access to this space"
                  color="danger"
                />
              </DropdownMenu>
            </Dropdown>
          ))}
        </div>

        <AddUsers space_id={space_id} existing={data.map((su) => su.user_id)} />
      </PopoverContent>
    </Popover>
  );
}
