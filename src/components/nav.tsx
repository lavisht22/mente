import { Button, Card } from "@heroui/react";
import { Link, useLocation } from "@tanstack/react-router";
import { LucideHome, LucideLayers, LucideUser2 } from "lucide-react";

const LINKS = [
  {
    to: "/",
    icon: <LucideHome className="size-5 shrink-0" />,
  },
  {
    to: "/spaces",
    icon: <LucideLayers className="size-5 shrink-0" />,
  },
  {
    to: "/profile",
    icon: <LucideUser2 className="size-5 shrink-0" />,
  },
];

export default function Nav() {
  const location = useLocation();

  return (
    <Card className="relative flex h-[calc(100vh - 2rem)] flex-col rounded-full">
      <div className="p-2 flex justify-center items-center border-b border-default-200">
        <div className="p-3">
          <div className="size-5 bg-black rounded-full" />
        </div>
      </div>

      <div className="flex-1">
        <nav className="p-2">
          <ul className="flex flex-col items-center">
            {LINKS.map((link) => (
              <li key={link.to} className="mb-2 last:mb-0">
                <Button
                  radius="full"
                  as={Link}
                  to={link.to}
                  size="lg"
                  variant="light"
                  color={location.pathname === link.to ? "primary" : "default"}
                  isIconOnly
                  fullWidth
                >
                  {link.icon}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </Card>
  );
}
