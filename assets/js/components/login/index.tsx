import React from "react";
import { Root, createRoot } from "react-dom/client";
import { Login, LoginProps } from "./Login";
import { loginUserAction } from "../../services/userService";
import { LiveViewHook, FormErrors } from "../../types/liveview";
import { initI18n } from "../../i18n";

interface LoginHookThis extends LiveViewHook {
	searchUser(email: string, password: string): void;
	opts(errorLoginUser?: FormErrors | {}): LoginProps;
}

const LoginHook: {
	mounted(this: LoginHookThis): void;
	destroyed(this: LoginHookThis): void;
	searchUser(this: LoginHookThis, email_: string, password_: string): void;
	opts(this: LoginHookThis, errorLoginUser?: FormErrors | {}): LoginProps;
} = {
	mounted() {
		const loginDomNode = document.getElementById('login') as Element;
		initI18n(loginDomNode?.getAttribute("data-locale"));
		const rootElement2 = createRoot(loginDomNode);

		render(rootElement2, this.opts());
		this.handleEvent("react.error_login_user", ({ errors }: { errors: FormErrors }) => {
			render(rootElement2, this.opts(errors));
		});
	},

	destroyed() {
		const loginDomNode = document.getElementById('login') as Element;
		const rootElement2 = createRoot(loginDomNode);
		rootElement2.unmount()
	},

	searchUser(email_, password_) {
		loginUserAction(this, email_, password_)
	},

	opts(error_login_user = {}): LoginProps {
		return {
			searchUser: this.searchUser.bind(this),
			errors: error_login_user
		}
	},
}

export default LoginHook;

function render(rootElement2: Root, opts: LoginProps) {
	rootElement2.render(
		<React.StrictMode>
			<Login {...opts}/>
		</React.StrictMode>
	);
}