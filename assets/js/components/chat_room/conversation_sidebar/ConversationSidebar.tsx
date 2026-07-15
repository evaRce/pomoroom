import React from "react";
import CurrentUserCard from "../user_info_bar/CurrentUserCard";
import ConversationTargetsList from "./ConversationTargetsList";
import MinimizedCallBar from "../call_panel/MinimizedCallBar";

export default function ConversationSidebar({ }) {
	return (
		<div className="hidden min-w-[20vw] sm:flex sm:flex-col sm:h-screen">
			<ConversationTargetsList />
			<MinimizedCallBar />
			<CurrentUserCard />
		</div>
	);
}