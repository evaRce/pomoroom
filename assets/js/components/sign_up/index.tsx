import React from "react";
import { Root, createRoot } from "react-dom/client";
import { SignUp, SignUpProps} from "./SignUp";
import { saveUserAction } from "../../services/userService";
import { LiveViewHook, FormErrors } from "../../types/liveview";

interface SignUpHookThis extends LiveViewHook {
	submitUser(email: string, password: string, nickname: string): void;
	opts(errorSaveUser?: FormErrors | {}): SignUpProps;
}

const SignUpHook: {
	mounted(this: SignUpHookThis): void;
	destroyed(this: SignUpHookThis): void;
	submitUser(this: SignUpHookThis, email_: string, password_: string, nickname_: string): void;
	opts(this: SignUpHookThis, errorSaveUser?: FormErrors | {}): SignUpProps;
} = {
	mounted() {
		const domNode = document.getElementById('signup') as Element;
		const rootElement = createRoot(domNode);

		render(rootElement, this.opts());
		this.handleEvent("react.error_save_user", ({ errors }: { errors: FormErrors }) => {
			render(rootElement, this.opts(errors))
		});
	},

	destroyed() {
		const domNode = document.getElementById('signup') as Element;
		const rootElement = createRoot(domNode);
		rootElement.unmount()
	},

	submitUser(email_, password_, nickname_) {
		saveUserAction(this, email_, password_, nickname_)
	},

	opts(error_save_user = {}): SignUpProps {
		return {
			submitUser: this.submitUser.bind(this),
			errors: error_save_user
		}
	},
}

export default SignUpHook;

function render(rootElement: Root, opts: SignUpProps) {
	rootElement.render(
		<React.StrictMode>
			<SignUp {...opts}/>
		</React.StrictMode>
	);
}