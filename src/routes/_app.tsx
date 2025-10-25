import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

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
    <main className="min-h-[100dvh] bg-default-50">
      <Outlet />
    </main>
  );
}
