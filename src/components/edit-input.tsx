import { Button, Input, type InputProps, addToast } from "@heroui/react";
import { LucideCheck, LucideSquarePen, LucideX } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface EditInputProps {
  label?: InputProps["label"];
  placeholder?: InputProps["placeholder"];
  description?: InputProps["description"];
  variant?: InputProps["variant"];
  initialValue: string;
  onValueUpdate: (value: string) => Promise<unknown>;
}

export default function EditInput({
  label,
  placeholder,
  description,
  variant,
  initialValue,
  onValueUpdate,
}: EditInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  const discardChanges = useCallback(() => {
    setValue(initialValue);
    setIsEditing(false);
  }, [initialValue]);

  const updateValue = useCallback(async () => {
    try {
      setLoading(true);

      await onValueUpdate(value);
      setIsEditing(false);
    } catch (error) {
      addToast({
        title: "Error",
        description: "Something went wrong while performing this action.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [value, onValueUpdate]);

  return (
    <div className="flex justify-center items-center gap-2">
      <Input
        ref={inputRef}
        label={label}
        placeholder={placeholder}
        description={description}
        variant={variant}
        isReadOnly={!isEditing}
        className="transition-all duration-200"
        value={value}
        onValueChange={setValue}
      />
      {isEditing ? (
        <div className="flex gap-2">
          <Button isIconOnly variant="light" onPress={discardChanges}>
            <LucideX className="size-4" />
          </Button>
          <Button
            isLoading={loading}
            isIconOnly
            color="primary"
            onPress={updateValue}
          >
            <LucideCheck className="size-4" />
          </Button>
        </div>
      ) : (
        <Button
          isIconOnly
          variant="light"
          onPress={() => {
            setIsEditing((prev) => !prev);
            inputRef.current?.focus();
          }}
        >
          <LucideSquarePen className="size-4" />
        </Button>
      )}
    </div>
  );
}
