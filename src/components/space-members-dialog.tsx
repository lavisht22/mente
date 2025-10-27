import { spaceUsersQuery } from "@/lib/queries";
import {
  Avatar,
  Button,
  Listbox,
  ListboxItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { LucideChevronDown } from "lucide-react";

interface SpaceMembersDialogProps {
  space_id: string;
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
      <PopoverContent className="p-4 min-w-72">
        <div className="flex flex-col gap-2 w-full">
          {data.map((spaceUser) => (
            <Popover key={spaceUser.user_id} placement="bottom-end">
              <PopoverTrigger>
                <Button
                  className="px-2"
                  variant="light"
                  startContent={
                    <Avatar
                      size="sm"
                      src={`https://api.dicebear.com/9.x/glass/svg?seed=${spaceUser.user_id}`}
                      fallback="?"
                    />
                  }
                  endContent={
                    <div className="text-default-500 flex items-center">
                      <p className="text-xs text-default-500">
                        {spaceUser.role.toUpperCase()}
                      </p>
                      <LucideChevronDown className="size-3" />
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
      </PopoverContent>
    </Popover>
  );
}
