import type { Tables } from "@/lib/supabase.types";
import { Card, CardBody } from "@heroui/react";
import { Link } from "@tanstack/react-router";

export default function Item({ id, title, type, markdown }: Tables<"items">) {
	if (type === "note") {
		return (
			<Card
				as={Link}
				to={`/items/${id}`}
				isPressable
				className="w-[180px] h-[216px] shrink-0 bg-yellow-50"
				shadow="sm"
			>
				<CardBody className="hover:bg-default/20 flex flex-col gap-2">
					<p className="text-sm text-default-500 font-medium line-clamp-1">
						{title}
					</p>
					<p className="text-xs text-default-500 line-clamp-5">{markdown}</p>
				</CardBody>
			</Card>
		);
	}

	return null;
}
