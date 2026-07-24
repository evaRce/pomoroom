import React from "react";
import { createRoot } from "react-dom/client";
import { Login, LoginProps } from "./Login";
import { loginUserAction } from "../../services/userService";

export default {
	mounted() {
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

function render(rootElement2: any, opts: LoginProps) {
	rootElement2.render(
		<React.StrictMode>
			<Login {...opts}/>
		</React.StrictMode>
	);
}