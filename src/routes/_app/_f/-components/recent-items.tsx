import Item from "@/components/item";
import { itemsQuery } from "@/lib/queries";
import { Alert, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

function ItemSkeleton() {
	return <Skeleton className="w-[180px] h-[216px] shrink-0 rounded-large" />;
}

export default function RecentItems() {
	const { data, isLoading, isError } = useQuery(itemsQuery);

	if (isLoading) {
		return (
			<div className="flex gap-4 w-full overflow-x-auto p-8 -mt-8 scrollbar-hide">
				<ItemSkeleton />
				<ItemSkeleton />
				<ItemSkeleton />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="p-8 -mt-8 flex items-center justify-center h-[216px]">
				<Alert
					className="max-w-md"
					color="danger"
					title="There was an error loading recent items."
				/>
			</div>
		);
	}

	return (
		<div className="flex gap-4 w-full overflow-x-auto p-8 -mt-8 scrollbar-hide">
			{data?.map((item) => (
				<Item key={item.id} {...item} />
			))}
		</div>
	);
}
