import { Button, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { NotebookPen } from "lucide-react";

const OPTIONS = [
	{
		label: "Note",
		icon: NotebookPen,
		shortcut: "N",
	},
];

export default function NewDropdown({
	trigger,
}: { trigger?: React.ReactNode }) {
	return (
		<Popover
			size="lg"
			backdrop="blur"
			classNames={{
				backdrop: "bg-background/50",
			}}
		>
			<PopoverTrigger>{trigger}</PopoverTrigger>
			<PopoverContent className="flex bg-transparent shadow-none">
				{OPTIONS.map((option) => (
					<Button
						key={option.label}
						size="lg"
						variant="light"
						className="h-full p-4"
						endContent={
							<div className="p-3 bg-default-200 rounded-full">
								<option.icon className="size-5" />
							</div>
						}
					>
						{option.label}
					</Button>
				))}
			</PopoverContent>
		</Popover>
	);
}
