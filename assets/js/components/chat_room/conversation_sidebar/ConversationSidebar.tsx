import React from "react";
import CurrentUserCard from "../user_info_bar/CurrentUserCard";
import ConversationTargetsList from "./ConversationTargetsList";

export default function ConversationSidebar({ }) {
	return (
		<div className="hidden min-w-[20vw] sm:block">
			<CurrentUserCard />
			<ConversationTargetsList />
		</div>
	);
}