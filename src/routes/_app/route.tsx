import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import Sidebar from "@/components/sidebar";
import supabase from "@/lib/supabase";

export const Route = createFileRoute("/_app")({
	beforeLoad: async ({ location }) => {
		const { data } = await supabase.auth.getClaims();

		if (!data || !data.claims) {
			throw redirect({
				to: "/auth",
				search: {
					redirect: location.href,
				},
			});
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex">
			<Sidebar />
			<main className="flex-1 overflow-y-auto">
				<Outlet />
			</main>
		</div>
	);
}
