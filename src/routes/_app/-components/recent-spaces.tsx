import Space from "@/components/space";
import { spacesQuery } from "@/lib/queries";
import { Alert, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

function SpaceSkeleton() {
	return <Skeleton className="w-[180px] h-[216px] shrink-0 rounded-large" />;
}

export default function RecentSpaces() {
	const { data, isLoading, isError } = useQuery(spacesQuery);

	if (isLoading) {
		return (
			<div className="flex gap-4 w-full overflow-x-auto p-8 -mt-8 scrollbar-hide">
				<SpaceSkeleton />
				<SpaceSkeleton />
				<SpaceSkeleton />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="p-8 -mt-8 flex items-center justify-center h-[216px]">
				<Alert
					className="max-w-md"
					color="danger"
					title="There was an error loading recent spaces."
				/>
			</div>
		);
	}

	return (
		<div className="flex gap-4 w-full overflow-x-auto p-8 -mt-8 scrollbar-hide">
			{data?.map((item) => (
				<Space key={item.id} {...item} />
			))}
		</div>
	);
}
