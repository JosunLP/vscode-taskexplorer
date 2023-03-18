
import "../common/css/vscode.css";
import "../common/css/page.css";
import "../common/scss/page.scss";
import "./license.css";

import { State } from "../../common/ipc";
import { TeWebviewApp } from "../webviewApp";
// import { loadScript, PayPalNamespace } from "@paypal/paypal-js";


export class LicenseWebviewApp extends TeWebviewApp<State>
{
	// private  _paypal: PayPalNamespace | null = null;
	// private _clientId = "";

	constructor()
    {
		super("LicenseWebviewApp");
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

}

new LicenseWebviewApp();
