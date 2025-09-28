import Item from "@/components/item";
import { itemsQuery } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";

export default function RecentItems() {
	const { data, isLoading, isError } = useQuery(itemsQuery);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (isError) {
		return <div>Error loading items.</div>;
	}

	return (
		<div className="flex gap-4">
			{data?.map((item) => (
				<Item key={item.id} {...item} />
			))}
		</div>
	);
}
