import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import FloatingChat from "@/components/floating-chat";
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
    <div className="relative flex h-screen">
      <div className="z-10 p-4">
        <Nav />
      </div>
      <main className="flex-1 h-screen flex overflow-y-auto">
        <div className="flex-1">
          <Outlet />
        </div>

        <FloatingChat />
      </main>
    </div>
  );
}
