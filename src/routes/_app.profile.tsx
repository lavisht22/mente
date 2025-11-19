import EditInput from "@/components/edit-input";
import { userQuery } from "@/lib/queries";
import supabase from "@/lib/supabase";
import { Button, Spinner } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LucideArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const { data: user, isError } = useQuery(userQuery);

  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) {
        throw new Error("User not found");
      }

      const { data, error } = await supabase
        .from("users")
        .update({ name })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
    },
  });

  if (isError) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <p>Unable to load spaces at the moment.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Spinner variant="wave" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-16 px-2 flex justify-between items-center gap-4">
        <div>
          <Button
            isIconOnly
            variant="light"
            size="lg"
            onPress={() => history.go(-1)}
          >
            <LucideArrowLeft className="size-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-medium mb-8">Profile</h1>

        <div className="flex flex-col gap-8">
          <EditInput
            label="Name"
            placeholder="How should people see your name"
            initialValue={user.name || ""}
            onValueUpdate={updateNameMutation.mutateAsync}
          />
        </div>
      </div>
    </div>
  );
}
