import NewDropdown from "@/components/new-dropdown";
import { Button } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { LucidePlus } from "lucide-react";
import RecentItems from "./-components/recent-items";

export const Route = createFileRoute("/_app/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="p-8 space-y-8">
			<div className="flex items-center gap-4">
				<div className="flex-1">
					<h1 className="text-2xl font-bold">Greeting!</h1>
				</div>
				<div>
					<NewDropdown
						trigger={
							<Button isIconOnly color="primary" variant="flat">
								<LucidePlus className="size-5" />
							</Button>
						}
					/>
				</div>
			</div>

			<div className="space-y-4">
				<h3 className="text-lg font-medium">Recent Items</h3>
				<RecentItems />
			</div>
		</div>
	);
}
