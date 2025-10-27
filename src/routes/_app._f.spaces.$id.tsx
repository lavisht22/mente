import SpaceMembersDialog from "@/components/space-members-dialog";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/_f/spaces/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-1 flex justify-between items-center gap-4">
        <div />
        <div>
          <SpaceMembersDialog space_id={id} />
        </div>
      </div>

      <div className="p-6">Space details</div>
    </div>
  );
}
