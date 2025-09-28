import type { Tables } from "@/lib/supabase.types";
import { Card, CardBody } from "@heroui/react";
import { Link } from "@tanstack/react-router";

export default function Item({ id, title, type }: Tables<"items">) {
	if (type === "note") {
		return (
			<Card
				as={Link}
				to={`/items/${id}`}
				isPressable
				className="w-36 h-36 bg-yellow-50"
			>
				<CardBody>{title}</CardBody>
			</Card>
		);
	}

	return null;
}
