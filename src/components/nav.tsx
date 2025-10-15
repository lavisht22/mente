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
    <Card className="fixed bottom-6 left-6 z-50 flex flex-row rounded-full">
      <nav className="p-1">
        <ul className="flex items-center">
          {LINKS.map((link) => (
            <li key={link.to}>
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
    </Card>
  );
}
