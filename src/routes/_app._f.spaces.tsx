import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/_f/spaces")({
	component: SpacesComponent,
});

function SpacesComponent() {
	return (
		<div className="p-2">
			<h3>Welcome to Spaces!</h3>
		</div>
	)
}
