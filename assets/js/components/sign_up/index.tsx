import React from "react";
import { createRoot } from "react-dom/client";
import { SignUp, SignUpErrors, SignUpProps} from "./SignUp";

interface SignUpHook {
	el: HTMLElement;
	handleEvent(event: string, callback: (payload: { errors: SignUpErrors }) => void): void;
	pushEventTo(el: HTMLElement, event: string, payload?: object): void;
	submitUser(email: string, password: string, nickname: string): void;
	opts(error_save_user?: SignUpErrors): SignUpProps;
}

export default{
    mounted(this: SignUpHook) {
		const domNode = document.getElementById('signup') as Element;
		const rootElement = createRoot(domNode);

		render(rootElement, this.opts());
    this.handleEvent("react.error_save_user", ({errors}) => {
			render(rootElement, this.opts(errors))
		});
	},

	destroyed() {
		const domNode = document.getElementById('signup') as Element;
		const rootElement = createRoot(domNode);
		rootElement.unmount()
	},

	submitUser(this: SignUpHook, email_: string, password_: string, nickname_: string) {
		this.pushEventTo(this.el, "action.save_user", { email: email_, password: password_, nickname: nickname_ })
	},

	opts(this: SignUpHook, error_save_user: SignUpErrors = {}): SignUpProps {
		return {
			submitUser: this.submitUser.bind(this),
			errors: error_save_user
		}
	},
}

function render(rootElement: any, opts: SignUpProps) {
	rootElement.render(
		<React.StrictMode>
			<SignUp {...opts}/>
		</React.StrictMode>
	);
}