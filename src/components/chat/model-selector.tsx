import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  cn,
  useDisclosure,
} from "@heroui/react";
import { LucideChevronUp, LucideLightbulb } from "lucide-react";

const MODELS = [
  {
    key: "gpt-5",
    thinking: true,
  },
  {
    key: "gpt-5-chat",
    thinking: false,
  },
  {
    key: "gemini-2.5-pro",
    thinking: true,
  },
  {
    key: "gemini-2.5-flash",
    thinking: true,
  },
];

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export default function ModelSelector({
  value,
  onValueChange,
}: ModelSelectorProps) {
  const { isOpen, onOpenChange } = useDisclosure();

  return (
    <Dropdown isOpen={isOpen} onOpenChange={onOpenChange}>
      <DropdownTrigger>
        <Button
          variant="flat"
          size="sm"
          radius="full"
          endContent={
            <LucideChevronUp
              className={cn(
                "size-4 animate duration-200",
                isOpen && "rotate-180",
              )}
            />
          }
        >
          {value}
        </Button>
      </DropdownTrigger>

      <DropdownMenu
        aria-label="Models"
        items={MODELS}
        onAction={(key) => {
          onValueChange(key as string);
          onOpenChange();
        }}
      >
        {(model) => (
          <DropdownItem
            variant="flat"
            key={model.key}
            textValue={model.key}
            title={model.key}
            value={model.key}
            endContent={
              model.thinking && <LucideLightbulb className="size-4" />
            }
          />
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
