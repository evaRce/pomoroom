import React from "react";
import { createRoot } from "react-dom/client";
import { EventProvider } from "./EventContext";
import { ChatRoom, ChatRoomProps } from "./ChatRoom";

export default {
	mounted(this: any) {
		const chatDomNode = document.getElementById('chat_container') as Element;
		const isAuthenticated = chatDomNode?.getAttribute("data-authenticated") === "true";

		if (!isAuthenticated) {
			window.location.replace("/login");
			return;
		}

		const rootElementChat = createRoot(chatDomNode);

		render(rootElementChat, this.opts());
		this.handleEvent("react", (event: any) => {
			render(rootElementChat, this.opts(event.event_name, event.event_data));
		});
	},

	destroyed(this: any) {
		const chatDomNode = document.getElementById('chat_container') as Element;
		const rootElementChat = createRoot(chatDomNode);
		rootElementChat.unmount();
	},

	pushEventToLiveView(this: any, event: any, payload: any) {
		this.pushEventTo(this.el, event, payload);
	},

	opts(eventName = "", eventData = {}) {
		return {
			eventName: eventName,
			eventData: eventData,
			pushEventToLiveView: this.pushEventToLiveView.bind(this)
		};
	},
}

function render(rootElement3: any, opts: ChatRoomProps) {
	rootElement3.render(
		<React.StrictMode>
			<EventProvider>
				<ChatRoom {...opts} />
			</EventProvider>
		</React.StrictMode>
	);
}