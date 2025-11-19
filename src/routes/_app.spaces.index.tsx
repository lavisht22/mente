import NewSpaceModal from "@/components/new-space-modal";
import Space from "@/components/space";

import { spacesQuery } from "@/lib/queries";
import { Button, Spinner, useDisclosure } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { LucideArrowLeft, LucidePlus } from "lucide-react";

export const Route = createFileRoute("/_app/spaces/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: spaces, isError } = useQuery(spacesQuery);
  const { isOpen, onOpenChange } = useDisclosure();

  if (isError) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <p>Unable to load spaces at the moment.</p>
      </div>
    );
  }

  if (!spaces) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Spinner variant="wave" />
      </div>
    );
  }

  return (
    <>
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
          <div className="flex items-center">
            <Button variant="light" size="lg" isIconOnly onPress={onOpenChange}>
              <LucidePlus className="size-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          <h1 className="text-3xl font-semibold mb-8">Spaces</h1>

          {spaces.length === 0 ? (
            <div className="text-center text-default-400 py-12">
              No items in this space yet
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              <div className="flex gap-4 flex-wrap">
                {spaces.map((item) => (
                  <Space key={item.id} {...item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <NewSpaceModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </>
  );
}
