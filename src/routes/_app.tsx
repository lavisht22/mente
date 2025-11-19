import {
  Outlet,
  createFileRoute,
  redirect,
  useMatchRoute,
} from "@tanstack/react-router";

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
  const matchRoute = useMatchRoute();

  const hideNav =
    matchRoute({ to: "/chats/$id", fuzzy: false }) ||
    matchRoute({ to: "/spaces/$spaceId/items/$itemId", fuzzy: false });

  return (
    <main className="h-[100dvh] w-[100dvw] overflow-hidden bg-default-50">
      <Outlet />
      {!hideNav && <Nav />}
    </main>
  );
}
