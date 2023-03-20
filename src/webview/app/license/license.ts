
import "../common/css/vscode.css";
import "../common/css/page.css";
import "../common/scss/page.scss";
import "./license.css";

import { State } from "../../common/ipc";
import { TeWebviewApp } from "../webviewApp";
import { Disposable, DOM } from "../common/dom";
// import { loadScript, PayPalNamespace } from "@paypal/paypal-js";
/*
// https://github.com/microsoft/vscode-webview-ui-toolkit-samples/blob/main/default/weather-webview/src/webview/main.ts
	provideVSCodeDesignSystem, Button, Dropdown, ProgressRing, TextField,
  	vsCodeButton, vsCodeDropdown, vsCodeOption, vsCodeTextField, vsCodeProgressRing
*/
import { provideVSCodeDesignSystem, vsCodeTextField } from "@vscode/webview-ui-toolkit";


export class LicenseWebviewApp extends TeWebviewApp<State>
{
	// private  _paypal: PayPalNamespace | null = null;
	// private _clientId = "";

	constructor()
    {
		super("LicenseWebviewApp");
		provideVSCodeDesignSystem().register(
			// vsCodeButton(),
			// vsCodeDropdown(),
			// vsCodeOption(),
			// vsCodeProgressRing(),
			vsCodeTextField()
		);
	}

	//  protected override onInitialize = (): void =>
	//  {
	//  	this.log("onInitialize", 1);
	//
	//  	loadScript({ "client-id": this._clientId, "data-page-type": "checkout", "data-csp-nonce": this.state.nonce })
	//  	.then((paypal) =>
	//  	{
	//  		this._paypal = paypal;
	//  		// const state = this.getState();
	//  		if (this._paypal && this._paypal.Buttons)
	//  		{
	//  			this._paypal.Buttons()
	//  			.render("#te-paypal-buttons")
	//  			.catch((error) => {
	//  				this.log("failed to render the PayPal Buttons", 1, error);
	//  			});
	//  		}
	//  		else {
	//  			console.error("failed to render the PayPal Buttons", 1);
	//  		}
	//  	})
	//  	.catch((error) => {
	//  		console.error("failed to load the PayPal JS SDK script", 1, error);
	//  	});
	//  };


    protected override onBind(): Disposable[]
    {
		return [
			DOM.on("[id=btnRegister]", "click", this.toggleRegistrationForm.bind(this)),
			DOM.on("[id=btnRegisterCancel]", "click", this.toggleRegistrationForm.bind(this)),
			DOM.on("[id=btnRegisterSubmit]", "click", this.toggleRegistrationForm.bind(this))
		];
    }


	private toggleRegistrationForm = () =>
	{
		const b = document.getElementById("buttonsPanelDiv") as HTMLElement,
			  r = document.getElementById("registrationFormDiv") as HTMLElement,
			  t = document.getElementById("buttonsRegistrationToggleFormTd") as HTMLElement;
		b.classList.toggle("is-registration");
		r.classList.toggle("is-registration");
		t.classList.toggle("is-registration");
	};

}

new LicenseWebviewApp();
