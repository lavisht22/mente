import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import Nav from "@/components/nav";
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
    <main className="min-h-screen bg-default-50">
      <Nav />
      <Outlet />
    </main>
  );
}
