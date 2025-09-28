import NewDropdown from "@/components/new-dropdown";
import { Button } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { LucidePlus } from "lucide-react";

export const Route = createFileRoute("/_app/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="p-8">
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
		</div>
	);
}
