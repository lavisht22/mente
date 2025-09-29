import type { Tables } from "@/lib/supabase.types";
import { Card, CardBody } from "@heroui/react";
import { Link } from "@tanstack/react-router";

export default function Item({ id, name }: Tables<"spaces">) {
	return (
		<Card
			as={Link}
			to={`/items/${id}`}
			isPressable
			className="w-[180px] h-[216px] shrink-0"
			shadow="sm"
		>
			<CardBody className="hover:bg-default/20 flex flex-col gap-2">
				<p className="text-sm text-default-500 font-medium line-clamp-1">
					{name}
				</p>
			</CardBody>
		</Card>
	);
}
