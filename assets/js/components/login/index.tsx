import React from "react";
import { createRoot } from "react-dom/client";
import { Login, LoginErrors, LoginProps } from "./Login";

interface LoginHook {
	el: HTMLElement;
	handleEvent(event: string, callback: (payload: { errors: LoginErrors }) => void): void;
	pushEventTo(el: HTMLElement, event: string, payload?: object): void;
	searchUser(email: string, password: string): void;
	opts(error_login_user?: LoginErrors): LoginProps;
}

export default {
	mounted(this: LoginHook) {
		const loginDomNode = document.getElementById('login') as Element;
		const rootElement2 = createRoot(loginDomNode);

		render(rootElement2, this.opts());
		this.handleEvent("react.error_login_user", ({ errors }) => {
			render(rootElement2, this.opts(errors));
		});
	},

	destroyed() {
		const loginDomNode = document.getElementById('login') as Element;
		const rootElement2 = createRoot(loginDomNode);
		rootElement2.unmount()
	},

	searchUser(this: LoginHook, email_: string, password_: string) {
		this.pushEventTo(this.el, "action.log_user", {email: email_, password: password_})
	},

	opts(this: LoginHook, error_login_user: LoginErrors = {}): LoginProps {
		return {
			searchUser: this.searchUser.bind(this),
			errors: error_login_user
		}
	},
}

function render(rootElement2: any, opts: LoginProps) {
	rootElement2.render(
		<React.StrictMode>
			<Login {...opts}/>
		</React.StrictMode>
	);
}