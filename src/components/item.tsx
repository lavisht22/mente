import { Card, CardBody } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import type { Tables } from "db.types";
import removeMd from "remove-markdown";

export default function Item({
  id,
  title,
  type,
  markdown,
  space_id,
}: Tables<"items">) {
  if (type === "note") {
    const plainText = markdown ? removeMd(markdown) : "";

    return (
      <Card
        as={Link}
        to={`/spaces/${space_id}/items/${id}`}
        isPressable
        className="w-[180px] h-[216px] shrink-0 bg-yellow-50"
        shadow="sm"
      >
        <CardBody className="hover:bg-default/20 flex flex-col gap-2">
          <p className="text-sm text-default-500 font-medium line-clamp-1">
            {title}
          </p>
          <p className="text-xs text-default-500 line-clamp-5">{plainText}</p>
        </CardBody>
      </Card>
    );
  }

  return null;
}
