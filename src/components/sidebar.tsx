import { Button, cn } from "@heroui/react";
import { Link, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronsLeft, LucideHome, LucideUser2 } from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
	const location = useLocation();

	const [isCollapsed, setIsCollapsed] = useState(false);

	const toggleCollapse = () => {
		setIsCollapsed(!isCollapsed);
	};

	return (
		<motion.div
			layout
			className="relative flex h-screen flex-col"
			initial={{ width: 256 }}
			animate={{ width: isCollapsed ? 64 : 256 }}
			transition={{ duration: 0.3 }}
		>
			<div className="p-2 flex justify-end items-center border-b border-default-200">
				<AnimatePresence>
					{!isCollapsed && (
						<motion.h1
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="flex-1 ml-2 text-lg font-medium"
						>
							mente
						</motion.h1>
					)}
				</AnimatePresence>
				<Button
					variant="light"
					size="lg"
					isIconOnly
					type="button"
					onPress={toggleCollapse}
					disableRipple
				>
					<ChevronsLeft
						className={cn("size-5 transform transition-transform", {
							"rotate-180": isCollapsed,
						})}
					/>
				</Button>
			</div>

			<div className="flex-1">
				<nav className="p-2">
					<ul>
						<li>
							<Button
								as={Link}
								to="/"
								size="lg"
								variant="light"
								isIconOnly={isCollapsed}
								fullWidth
								className={cn(
									"px-3 justify-start",
									location.pathname === "/" ? "text-primary" : "",
								)}
							>
								<LucideHome className="size-5 shrink-0" />
								{!isCollapsed && (
									<motion.span
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
									>
										Home
									</motion.span>
								)}
							</Button>
						</li>
					</ul>
				</nav>
			</div>
			<div className="p-2 border-t border-default-200">
				<Button
					as={Link}
					to="/profile"
					size="lg"
					variant="light"
					isIconOnly={isCollapsed}
					className="px-3 justify-start"
					fullWidth
				>
					<LucideUser2 className="size-5 shrink-0" />
					{!isCollapsed && (
						<motion.span
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							Profile
						</motion.span>
					)}
				</Button>
			</div>
		</motion.div>
	);
}
