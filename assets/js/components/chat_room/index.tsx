import React from "react";
import { Root, createRoot } from "react-dom/client";
import { EventProvider } from "./EventContext";
import { ChatRoom, ChatRoomProps } from "./ChatRoom";
import { LiveViewHook } from "../../types/liveview";
import { PushEventToLiveView } from "../../types/events";
import { initI18n } from "../../i18n";

interface ChatRoomHookThis extends LiveViewHook {
	pushEventToLiveView: PushEventToLiveView;
	opts(eventName?: string, eventData?: Record<string, unknown>): ChatRoomProps;
}

const ChatRoomHook: {
	mounted(this: ChatRoomHookThis): void;
	destroyed(this: ChatRoomHookThis): void;
	pushEventToLiveView(this: ChatRoomHookThis, event: string, payload: object): void;
	opts(this: ChatRoomHookThis, eventName?: string, eventData?: Record<string, unknown>): ChatRoomProps;
} = {
	mounted() {
		const chatDomNode = document.getElementById('chat_container') as Element;
		const isAuthenticated = chatDomNode?.getAttribute("data-authenticated") === "true";

		if (!isAuthenticated) {
			window.location.replace("/login");
			return;
		}

		initI18n(chatDomNode?.getAttribute("data-locale"));

		const rootElementChat = createRoot(chatDomNode);

		render(rootElementChat, this.opts());
		this.handleEvent<{ event_name: string; event_data: Record<string, unknown> }>("react", (event) => {
			render(rootElementChat, this.opts(event.event_name, event.event_data));
		});
	},

	destroyed() {
		const chatDomNode = document.getElementById('chat_container') as Element;
		const rootElementChat = createRoot(chatDomNode);
		rootElementChat.unmount();
	},

	pushEventToLiveView(event, payload) {
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

export default ChatRoomHook;

function render(rootElement3: Root, opts: ChatRoomProps) {
	rootElement3.render(
		<React.StrictMode>
			<EventProvider>
				<ChatRoom {...opts} />
			</EventProvider>
		</React.StrictMode>
	);
}