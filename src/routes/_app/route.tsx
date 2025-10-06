import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

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
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className="relative flex h-screen bg-default-50">
      <div className="z-10 p-4">
        <Nav />
      </div>
      <main className="flex-1 h-screen flex overflow-y-auto">
        <motion.div
          layout
          className="flex-1"
          transition={{
            duration: 0.5,
            type: "spring",
          }}
        >
          <Outlet />
        </motion.div>

        <AnimatePresence>
          <FloatingChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            onOpen={() => setIsChatOpen(true)}
          />
        </AnimatePresence>
      </main>
    </div>
  );
}
