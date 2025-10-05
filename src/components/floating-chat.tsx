import { Button, Card } from "@heroui/react";
import { LucideMessageSquareShare, LucideMinimize2 } from "lucide-react";
import { useState } from "react";
import Chat from "./chat";

export default function FloatingChat() {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="fixed bottom-6 right-6 z-30">
        <Button
          radius="full"
          isIconOnly
          size="lg"
          onPress={() => setCollapsed(false)}
        >
          <LucideMessageSquareShare className="size-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full p-4 pl-0 sticky top-0 z-20 w-full max-w-md 2xl:max-w-lg">
      <Card className="h-full overflow-hidden">
        <div className="p-2 flex justify-between items-center border-b border-default-200">
          <div />
          <Button isIconOnly variant="light" onPress={() => setCollapsed(true)}>
            <LucideMinimize2 className="size-5" />
          </Button>
        </div>
        <Chat chatId="e7423fcf-454e-48e6-ab57-ec1348f878b0" />
      </Card>
    </div>
  );
}
