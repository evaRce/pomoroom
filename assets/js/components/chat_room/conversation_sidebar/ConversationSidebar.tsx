import React from "react";
import CurrentUserCard from "../user_info_bar/CurrentUserCard";
import ConversationTargetsList from "./ConversationTargetsList";
import MinimizedCallBar from "../call_panel/MinimizedCallBar";

interface ConversationSidebarProps {
	mobileHidden?: boolean;
}

export default function ConversationSidebar({ mobileHidden }: ConversationSidebarProps) {
	return (
		<div
			className={`${mobileHidden ? "hidden" : "flex"} h-dvh w-full flex-col overflow-hidden sm:flex sm:h-screen sm:w-72 sm:min-w-[240px] sm:max-w-[22vw] sm:shrink-0 sm:flex-col lg:w-80 xl:w-96`}
		>
			<ConversationTargetsList />
			<MinimizedCallBar />
			<CurrentUserCard />
		</div>
	);
}