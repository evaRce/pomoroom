import React from "react";
import { createRoot } from "react-dom/client";
import { SignUp, SignUpProps} from "./SignUp";


export default{
    mounted() {
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

	submitUser(email_, password_, nickname_) {
		this.pushEventTo(this.el, "action.save_user", { email: email_, password: password_, nickname: nickname_ })
	},

	opts(error_save_user = {}): SignUpProps {
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