
import "../common/css/vscode.css";
import "../common/css/page.css";
import "../common/scss/page.scss";
import "./license.css";

import copy from "copy-text-to-clipboard";
import { IIpcMessage, IpcRegisterAccountMsg, IpcShowMessageCommand, State } from "../../common/ipc";
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
	private timeout: NodeJS.Timeout | undefined;
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


	private copyKey = () =>
	{
		copy(this.state.account.license.key);
		this.sendCommand(IpcShowMessageCommand, { message: "Key successfully copied to clipboard" });
	};


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
		const disposables = [
			DOM.on("[id=btnRegister]", "click", this.toggleRegistrationForm.bind(this)),
			DOM.on("[id=btnRegisterSubmit]", "click", this.submitRegistration.bind(this)),
			DOM.on("[id=btnRegisterCancel]", "click", this.toggleRegistrationForm.bind(this)),
			DOM.on("[id=copyKeySpan]", "click", this.copyKey.bind(this))
		];
		return disposables;
    }


    protected override onDispose(): void
    {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}
    }


	protected override onMessageReceived(e: MessageEvent): void
    {
		const msg = e.data as IIpcMessage;
        switch (msg.method)
        {
			case "echo/account/register": // Standard echo service for testing web->host commands in mocha tests
				this.log(`onMessageReceived(${msg.id}): method=${msg.method}`, 1);
				this.sendCommand({ method: "account/register", overwriteable: false }, msg.params);
				break;
			case "echo/message/show": // Standard echo service for testing web->host commands in mocha tests
				this.log(`onMessageReceived(${msg.id}): method=${msg.method}`, 1);
				this.copyKey();
				break;
		}
	};


	private submitRegistration = () =>
	{
		const f = document.getElementById("firstName") as HTMLInputElement,
			  l = document.getElementById("lastName") as HTMLInputElement,
			  e = document.getElementById("emailAddress") as HTMLInputElement,
			  ea = document.getElementById("emailAddressAlt") as HTMLInputElement;
		if (f && l && e && f.value && l.value && this.valdateEmailAddress(e.value))
		{
			this.sendCommand(IpcRegisterAccountMsg, {
				firstName: f.value.trim(),
				lastName: l.value.trim(),
				email: e.value.trim(),
				emailAlt: ea.value.trim()
			});
			this.toggleRegistrationForm();
		}
		else
		{
			const r = document.getElementById("registrationFormDiv") as HTMLElement;
			if (!r.classList.contains("had-registration-error")) {
				r.classList.add("had-registration-error");
			}
			this.timeout = setTimeout((_r: HTMLElement) => {
				this.timeout = undefined;
				if (_r.classList.contains("had-registration-error")) {
					_r.classList.remove("had-registration-error");
				}
			}, 4000, r);
		}
	};


	private toggleRegistrationForm = () =>
	{
		const b = document.getElementById("buttonsPanelDiv") as HTMLElement,
			  r = document.getElementById("registrationFormDiv") as HTMLElement;
		b.classList.toggle("is-registration");
		r.classList.toggle("is-registration");
		if (r.classList.contains("had-registration-error")) {
			r.classList.remove("had-registration-error");
		}
	};


	private valdateEmailAddress = (e: string) => e && e.length <= 64 && /[a-z0-9_\-\.]+\@[a-z0-9_\-\.]+\.[a-z]{2,5}/i.test(e);

}

new LicenseWebviewApp();
