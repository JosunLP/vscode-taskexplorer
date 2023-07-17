/* eslint-disable @typescript-eslint/naming-convention */

/* TEMP */ /* istanbul ignore file */

import { IDictionary } from ":types";
import { TeWrapper } from "../wrapper";
import { ITeApiEndpoint, TeServer } from "./server";
import { LicensePage } from "../../webview/page/licensePage";
import { Disposable, Event, EventEmitter, window } from "vscode";
import { executeCommand, registerCommand } from "../command/command";
import { IpcAccountRegistrationParams } from "../../webview/common/ipc";
import {
	ITeLicenseManager, TeLicenseType, TeSessionChangeEvent, ITeAccount, ITeTaskChangeEvent, ContextKeys,
	TeLicenseState, TeRuntimeEnvironment, ITeSession, ISecretStorageChangeEvent, IStatusBarInfo, TeTaskSource, ITeLicense
} from "../../interface";


export class LicenseManager implements ITeLicenseManager, Disposable
{
	private _LICENSE_SERVER_DISABLED_ = true;

	private _busy = false;
	private _maxFreeTasks = 500;
	private _account: ITeAccount;
	private _maxFreeTaskFiles = 100;
	private _accountChangeNumber = 0;
	private _maxTasksMessageShown = false;
	private _maxFreeTasksForTaskType = 100;
	private _maxFreeTasksForScriptType = 50;
	private _checkLicenseTask: NodeJS.Timeout;
	private _sbInfo: IStatusBarInfo | undefined;

	private readonly _server: TeServer;
    private readonly _onReady: EventEmitter<void>;
	private readonly _defaultSessionInterval = 1000 * 60 * 60 * 4;
	private readonly _disposables: Disposable[] = [];
	private readonly _maxTaskTypeMsgShown: IDictionary<boolean> = {};
    private readonly _onSessionChange: EventEmitter<TeSessionChangeEvent>;

	private readonly _sessionInterval = <{ [id in TeRuntimeEnvironment]: number}>{
		production: this._defaultSessionInterval, // 4 hr
		tests: this._defaultSessionInterval, // 4 hr
		dev: 1000 * 60 * 10 // 10 min
	};


	constructor(private readonly wrapper: TeWrapper)
    {
		this._account = this.getNewAccount();
		this._onReady = new EventEmitter<void>();
		this._onSessionChange = new EventEmitter<TeSessionChangeEvent>();
		this._server = new TeServer(wrapper);
		this._checkLicenseTask = setInterval(this.checkLicense, this.sessionInterval, "");
		this._disposables.push(
			this._onReady,
			this._onSessionChange,
			wrapper.storage.onDidChangeSecret(this.onSecretStorageChange, this),
			wrapper.treeManager.onDidTaskCountChange(this.onTasksChanged, this),
			registerCommand(wrapper.keys.Commands.ExtendTrial, this.extendTrial, this),
			registerCommand(wrapper.keys.Commands.PurchaseLicense, this.purchaseLicense, this),
			registerCommand(wrapper.keys.Commands.RefreshSession, () => this.validateLicense(this.lic.key, ""), this),
			registerCommand(wrapper.keys.Commands.Register, this.register, this)
		);
    }

	dispose = () => { clearInterval(this._checkLicenseTask); this._disposables.splice(0).forEach((d) => d.dispose()); };


	get account(): ITeAccount { return this._account; }
	get isBusy(): boolean { return this._busy; }
	/* TEMP */get isDisabled(): boolean { return this._LICENSE_SERVER_DISABLED_; }
	get isErrorState(): boolean { return !!this._account.errorState; }
	get isLicensed(): boolean { return !!this._account.errorState || this.isTrial || this.lic.type >= TeLicenseType.Standard; }
	get isPaid(): boolean { return this.lic.type >= TeLicenseType.Standard && this.lic.state === TeLicenseState.Paid; }
	get isRegistered(): boolean { return this._account.verified; }
	get isTrial(): boolean { return this.lic.type <= TeLicenseType.TrialExtended && this.lic.state === TeLicenseState.Trial && this.lic.period <= 2; }
	get isTrialExtended(): boolean { return this.lic.type === TeLicenseType.TrialExtended && this.lic.state === TeLicenseState.Trial && this.lic.period === 2; }
	get lic(): ITeLicense { return this._account.license; }
    get onDidSessionChange(): Event<TeSessionChangeEvent> { return this._onSessionChange.event; }
    get onReady(): Event<void> { return this._onReady.event; }
	get sessionInterval(): number { return this._sessionInterval[this.wrapper.env]; }

	get statusDays(): string
	{
		let days: number | string = "";
		if (!this._account.errorState)
		{
			if (this.isTrial) {
				days = this.wrapper.utils.getDateDifference(Date.now(), this.lic.expires, "d");
			}
			else if (this.isLicensed) {
				days = this.wrapper.utils.getDateDifference(Date.now(), this.lic.expires, "d");
			}
		}
		if (days && days < 0) {
			days = "--";
		}
		return /* TEMP */!this._LICENSE_SERVER_DISABLED_ ? days.toString() : "";
	}

    get statusDescription(): string
	{
		let dsc = "UNLICENSED";
		if (this._account.errorState) {
			dsc = "LIC SVR ERROR";
		}
		else if (this.isTrial) {
			dsc = (this.lic.period <= 1 ? "PRE-TRIAL" : "EXT-TRIAL");
		}
		else if (this.isLicensed) {
			dsc = "LICENSED";
		}
		return /* TEMP */!this._LICENSE_SERVER_DISABLED_ ? dsc : "LIC SVR INACTIVE";
	}


	private beginTrial = async(logPad: string): Promise<void> =>
	{
		this.wrapper.log.methodStart("begin trial", 1, logPad);
		this._busy = true;
		const sbInfo = this._sbInfo = this.wrapper.statusBar.info;
		const result = await this.executeRequest("register/trial/start", logPad + "   ", {});
		this.wrapper.utils.execIf(result, () =>
		{
			window.showInformationMessage(`Welcome to ${this.wrapper.extensionTitle} 3.0.  Your 30 day trial has been activated.`, "More Info")
			.then((action) =>
			{
				if (action === "More Info") {
					void executeCommand(this.wrapper.keys.Commands.ShowLicensePage);
				}
			});
		}, this);
		this.restoreStatusBar(sbInfo);
		this.wrapper.log.methodDone("begin trial", 1, logPad, [[ "result", !!result ]]);
	};


	checkLicense = async(logPad: string): Promise<void> =>
	{
		this._account.errorState = false;
		this.wrapper.log.methodStart("license manager check license", 1, logPad);

		try
		{
			this._account = await this.getStoredAccount();
			this.logAccountFields(logPad + "   ");
			/* TEMP */await this.wrapper.utils.execIf(/* TEMP */!this._LICENSE_SERVER_DISABLED_, async () =>
			{
				if (this.lic.type !== TeLicenseType.None)
				{
					if (this.lic.key && this.lic.type !== TeLicenseType.Free)
					{
						if (this._account.session.expires <= Date.now() + this.sessionInterval)
						{
							this._busy = true;
							await this.validateLicense(this.lic.key, logPad + "   ");
						}
						else {
							await this.displayPopup("Purchase a license to unlock unlimited parsed tasks.", logPad + "   ");
						}
					}
					else {
						await this.displayPopup("Purchase a license to unlock unlimited parsed tasks.", logPad + "   ");
					}
				}
				else {
					this._busy = true;
					await this.beginTrial(logPad + "   ");
				}
			}, this);
		}
		finally
		{   /* TEMP */this.wrapper.utils.execIf(/* TEMP */this._LICENSE_SERVER_DISABLED_, () =>
			{
				this._account.license.state = TeLicenseState.Paid;
				this._account.license.type = TeLicenseType.Standard;
				this._account.license.paid = true;
				this._account.verified = true;
			}, this);
			this.setContext();
		}

		this.wrapper.log.methodDone("license manager check license", 1, logPad, [
			[ "trial", this.isTrial ], [ "registered", this.isRegistered ], [ "licensed", this.isLicensed ]
		]);
	};


	private displayPopup = async (message: string, logPad: string): Promise<void> =>
	{
		const lastNag = this.wrapper.storage.get<string>(this.wrapper.keys.Storage.LastLicenseNag);
		this.wrapper.log.methodStart("license manager display popup", 1, logPad, false, [[ "last nag", lastNag ]]);

		//
		// Only display the nag on startup once every 30 days.  If the version
		// changed, the webview will be shown instead regardless of the nag state.
		//
		let displayPopup = !this.isLicensed || this.isTrial;
		if (displayPopup && lastNag)
		{
			const now = Date.now(),
				  lastNagDate = parseInt(lastNag, 10);
			displayPopup = ((now - lastNagDate)  / 1000 / 60 / 60 / 24) > 30;
		}

		if (displayPopup)
		{
			const options = [ "Buy License", "Info", "Not Now" ];
			if (this.lic.type !== TeLicenseType.TrialExtended) {
				options.push("Extend Trial");
			}
			await this.wrapper.storage.update(this.wrapper.keys.Storage.LastLicenseNag, Date.now().toString());
			window.showInformationMessage(message, ...options)
			.then((action) =>
			{
				if (action === "Buy License")
				{
					void executeCommand(this.wrapper.keys.Commands.PurchaseLicense);
				}
				else if (action === "Extend Trial")
				{
					void executeCommand(this.wrapper.keys.Commands.ExtendTrial);
				}
				else if (action === "Info")
				{
					void executeCommand(this.wrapper.keys.Commands.ShowLicensePage);
				}
			});
		}

		this.wrapper.log.methodDone("license manager display popup", 1, logPad);
	};


	private executeRequest = async (ep: ITeApiEndpoint, logPad: string, params: Record<string, any>): Promise<boolean> =>
	{
		const token = this._account.session.token;
		this._busy = true;
		try
		{
			const account = await this._server.request<ITeAccount>(ep, token, logPad, { accountId: this._account.id,  ...params });
			await this.saveAccount(account, false, logPad);
			this.wrapper.statusBar.update("");
			return true;
		}
		catch (e)
		{
			await this.handleServerError(e);
			return false;
		}
		finally {
			this._busy = false;
			this._onReady.fire();
		}
	};


	private extendTrial = async (logPad: string): Promise<void> =>
	{
		const ep: ITeApiEndpoint = "register/trial/extend";
		const sbInfo = this._sbInfo = this.wrapper.statusBar.info;

		this.wrapper.statusBar.update("Requesting extended trial");
		this.wrapper.log.methodStart("request extended trial", 1, logPad, false, [[ "endpoint", ep ]]);

		if (this.lic.period > 1 || !this.isRegistered)
		{
			const msg = "user is not registered or an extended trial license has already been allocated to this machine";
			window.showInformationMessage("Can't proceed - " + msg);
			this.wrapper.log.write("   " + msg, 1, logPad);
			this.wrapper.log.methodDone("request extended trial", 1, logPad);
			this.wrapper.statusBar.show(sbInfo);
			return;
		}

		//
		// TODO - Collect name and email address to allow 2nd trial
		//
		const firstName = "Scott",
			  lastName = "Meesseman",
			  email = `scott-${this.wrapper.utils.getRandomNumber()}@spmeesseman.com`;

		this._busy = true;
		await this.executeRequest(ep, logPad + "   ", {
			accountId: this._account.id,
			email,
			firstName,
			lastName,
			tests: this.wrapper.tests
		});

		this.restoreStatusBar(sbInfo);
		this.wrapper.log.methodDone("request extended trial", 1, logPad);
	};


	private getNewAccount = (): ITeAccount =>
	{
		const now = Date.now();
		return {
			id: 0,
			created: now,
			email: "",
			firstName: "",
			lastName: "",
			name: "",
			orgId: 0,
			trialId: 0,
			verified: false,
			verificationPending: false,
			session: {
				expires: 0,
				issued: 0,
				token: "",
				scopes: [ "te-explorer", "te-sidebar", "te-monitor-free" ],
			},
			license: {
				id: 1,
				expired: false,
				expires: 0,
				issued: 0,
				key: "",
				paid: false,
				period: 0,
				state: TeLicenseState.Trial,
				type: TeLicenseType.None
			}
		};
	};


	private getStoredAccount = (): Thenable<ITeAccount> =>
		this.wrapper.storage.getSecret<ITeAccount>(this.wrapper.keys.Storage.Account, this._account);


	getMaxNumberOfTasks = (taskType?: TeTaskSource): number =>
		(this.isLicensed ? Infinity : (!taskType ? this._maxFreeTasks :
						(this.wrapper.taskUtils.isScriptType(taskType) ? this._maxFreeTasksForScriptType : this._maxFreeTasksForTaskType)));


	getMaxNumberOfTaskFiles = (): number =>  (this.isLicensed ? Infinity : this._maxFreeTaskFiles);


	private getPaypalWebhookPayload = () => ({
		id: "5O190127TN364715T",
		create_time: "2018-04-16T21:21:49.000Z",
		event_type: "CHECKOUT.ORDER.COMPLETED",
		resource_type: "checkout-order",
		resource_version: "2.0",
		summary: "Checkout Order Completed",
		zts: 1494957670,
		event_version: "1.0",
		resource: {
			id: "5O190127TN364715T",
			intent: "CAPTURE",
			status: "COMPLETED",
			create_time: "2018-04-01T21:18:49Z",
			update_time: "2018-04-01T21:20:49Z",
			gross_amount: {
				value: "19.00",
				currency_code: "USD"
			},
			payer: {
				payer_id: "PAYPAL_PAYER_ID",
				email_address: "buyer@example.com",
				name: {
					given_name: "John",
					surname: "Doe"
				}
			},
			purchase_units: [{
				reference_id: `${this._account.id}`,
				amount: {
					currency_code: "USD",
					value: "19.00"
				 },
				payee: {
					email_address: `scott-${this.wrapper.utils.getRandomNumber()}@spmeesseman.com`
				}
			}],
			shipping: {
				method: "United States Postal Service",
				address: {
				   address_line_1: "2211 N First Street",
				   address_line_2: "Building 17",
				   admin_area_2: "San Jose",
				   admin_area_1: "CA",
				   postal_code: "95131",
				   country_code: "US"
				}
			},
			payments: {
				captures: [
				{
					id: "3C679366HH908993F",
					status: "COMPLETED",
					final_capture: true,
					create_time: "2018-04-01T21:20:49Z",
					update_time: "2018-04-01T21:20:49Z",
					amount: {
						currency_code: "USD",
						value: "19.00"
					},
					seller_protection: {
						status: "ELIGIBLE",
						dispute_categories: [
							"ITEM_NOT_RECEIVED",
							"UNAUTHORIZED_TRANSACTION"
						]
					},
					seller_receivable_breakdown: {
						gross_amount: {
						   currency_code: "USD",
						   value: "19.00"
						},
						paypal_fee: {
						   currency_code: "USD",
						   value: "2.00"
						},
						net_amount: {
						   currency_code: "USD",
						   value: "17.00"
						}
					 },
					 links: [{
						href: "https://api.paypal.com/v2/checkout/orders/5O190127TN364715T",
						rel: "self",
						method: "GET"
					}]
				}]
			},
			links: [{
				href: "https://api.paypal.com/v2/checkout/orders/5O190127TN364715T",
				rel: "self",
				method: "GET"
			}]
		}
	});


	private handleServerError = async (e: any): Promise<void> =>
	{
		// eslint-disable-next-line eqeqeq
		this._account.errorState = e instanceof Error || e.status == 500;
		await this.wrapper.utils.execIf2(!(e instanceof Error), async(e) =>
		{   //
		    // Possible Error Status Codes:
			//
			//     201  : Success
			//     400  : Client Error (Invalid Parameters)
			//     402  : Payment required, trial extension already granted
			//     406  : Invalid License Key
			//     408  : Timeout
			//     409  : Trial already exists
			//     409  : License/Account/Trial Record Not Found
			//     500  : Server Error
			//
			const body = this.wrapper.objUtils.apply({ message: e.message }, e.body);
			this.wrapper.log.error(
				[ `the license server @  ${this._server.apiServer} is down or has returned an error status`, e ],
				[[ "status code", e.status ], [ "server message", body.message ], [ "response body",  JSON.stringify(e.body) ]]
			);
			await this.wrapper.utils.execIf2(!this._account.errorState, async (m) =>
			{
				switch (m)
				{
					case "Account does not exist":         // 409 (Conflict)
					case "Account trial does not exist":   // 409 (Conflict)
					case "Account license does not exist": // 409 (Conflict)
					case "Trial already exists":           // 409 (Conflict)
						this._account.verified = false;
					// eslint-disable-next-line no-fallthrough
					case "Invalid license key":            // 406
						this._account.license.type = TeLicenseType.Free;
						this._account.license.state = TeLicenseState.Free;
						await this.saveAccount(this._account, true, "   ");
						break;
					case "Access Denied": // 401 (unauthorized) - token expired, or invalid
					default:
						this._account.errorState = true;
						break;
				}
			}, this, undefined, body.message);
		}, this, [ this.wrapper.log.error ], e);
		this.wrapper.statusBar.showTimed({ text: "Server error" }, this._sbInfo);
		this._sbInfo = undefined;
	};


	private logAccountFields = (logPad: string) =>
	{
		const _v = (e: [ string, any ]) =>
		{
			if (!e[0].match(/(?:expires|issued)/i)) return e[1];
			return this.wrapper.utils.formatDate(e[1]);
		};
		const _l = (o: object, p: string) =>
		{
			Object.entries(o).forEach((e) =>
			{
				if (!this.wrapper.typeUtils.isObject(e[1])) {
					this.wrapper.log.value(`   ${e[0]}`, !e[0].match(/(?:token|key|machine)/i) ? _v(e) : "*****", 1, p);
				}
				else {
					this.wrapper.log.write(`   ${e[0]} details:`,  1, p);
					_l(e[1], p + "   ");
				}
			});
		};
		this.wrapper.log.write("Account details:",  1, logPad);
		_l(this._account, logPad);
	};


	private onSecretStorageChange = async (e: ISecretStorageChangeEvent) =>
	{
		if (e.key === this.wrapper.keys.Storage.Account)
		{
			const pAccount = this.wrapper.utils.cloneJsonObject<ITeAccount>(this._account);
			this._account = this.wrapper.utils.cloneJsonObject<ITeAccount>(e.value);
			this.setContext();
			this._onSessionChange.fire(
			{
				account: this.wrapper.utils.cloneJsonObject<ITeAccount>(this._account),
				changeNumber: this._accountChangeNumber,
				changeFlags: {
					expiration: this.lic.expired !== pAccount.license.expired,
					license: this.lic.paid !== pAccount.license.paid,
					licenseState: this.lic.state !== pAccount.license.state,
					licenseType: this.lic.type !== pAccount.license.type,
					paymentDate: this.lic.paid !== pAccount.license.paid,
					session: this._account.session.token !== pAccount.session.token,
					trialPeriod: this.lic.type < 4 && this.lic.period !== pAccount.license.period,
					verification: this._account.verified !== pAccount.verified || this._account.verificationPending !== pAccount.verificationPending
				},
				session: {
					added: [],
					removed: [ this.wrapper.utils.cloneJsonObject<ITeSession>(pAccount.session) ],
					changed: [ this.wrapper.utils.cloneJsonObject<ITeSession>(this._account.session) ]
				}
			});
		}
	};


	private onTasksChanged = (e: ITeTaskChangeEvent) =>
	{
		this.wrapper.log.methodEvent("license event", "on tasks changed", 1);
		if (e.tasks.length > this.getMaxNumberOfTasks(e.task?.source)) {
			this.setMaxTasksReached();
			this.displayPopup("Purchase a license to unlock unlimited parsed tasks.", "");
		}
	};


	private purchaseLicense = async (logPad: string): Promise<void> =>
	{
		this.wrapper.log.methodStart("purchase license", 1, logPad);
		/* istanbul ignore else */
		if (this.wrapper.tests)
		{   //
			// For tests, simulate a payment triggered by a PayPal transaction using the
			// license/payment endpoint, then call the license/validate endpoint to retrieve
			// the new license state
			//
			this._busy = true;
			const sbInfo = this._sbInfo = this.wrapper.statusBar.info;
			this.wrapper.statusBar.update("Sending payment request");
			const ep: ITeApiEndpoint = "payment/paypal/hook",
				  token = this._account.session.token;
			await this.wrapper.utils.wrap(
				async () =>
				{
					await this._server.request<any>(ep, token, logPad, this.getPaypalWebhookPayload());
					await this.wrapper.utils.sleep(50);
					await this.validateLicense(this.lic.key, logPad + "   ");
				},
				[ this.handleServerError ], this
			);
			this.restoreStatusBar(sbInfo);
			this._busy = false;
			this._onReady.fire();
		}
		else
		{
			this.wrapper.utils.openUrl(
				`https://license.spmeesseman.com/payment/paynow/${this.wrapper.extensionName}/${this.account.id}/v1`
			);
		}
		this.wrapper.log.methodDone("purchase license", 1, logPad);
	};


	private register = (): Promise<LicensePage> => this.wrapper.licensePage.show(undefined, { register: true });


	private restoreStatusBar = (sbInfo: IStatusBarInfo) =>
	{
		this.wrapper.statusBar.show(sbInfo);
		this._sbInfo = undefined;
	};


	private saveAccount = async (account: ITeAccount, force: boolean, logPad: string): Promise<void> =>
	{
		if (!force)
		{
			const compareCurrent = { ...this.wrapper.utils.cloneJsonObject<ITeAccount>(this._account), ...{ session: {}}};
			const compareNew = { ...this.wrapper.utils.cloneJsonObject<ITeAccount>(account), ...{ session: {}}};
			if (JSON.stringify(compareNew) === JSON.stringify(compareCurrent)) {
				return;
			}
		}
		this.wrapper.log.methodStart("save account", 1, logPad, false, [
			[ "account id", account.id ],
			[ "account change #", ++this._accountChangeNumber ],
			[ "license issued", this.wrapper.utils.formatDate(account.session.issued) ],
			[ "license expires", this.wrapper.utils.formatDate(account.session.expires) ]
		]);
		await this.wrapper.storage.updateSecret(this.wrapper.keys.Storage.Account, JSON.stringify(account));
		this.wrapper.log.methodDone("save account", 1, logPad);
	};


	private setContext = () =>
	{
		void this.wrapper.contextTe.setContext(`${ContextKeys.AccountPrefix}licensed`, this.isLicensed);
		void this.wrapper.contextTe.setContext(`${ContextKeys.AccountPrefix}registered`, this.isRegistered);
		void this.wrapper.contextTe.setContext(`${ContextKeys.AccountPrefix}trial`, this.isTrial);
		void this.wrapper.contextTe.setContext(`${ContextKeys.AccountPrefix}trialext`, this.isTrialExtended);
		void this.wrapper.contextTe.setContext(`${ContextKeys.AccountPrefix}license:type`, this.lic.type);
		void this.wrapper.contextTe.setContext(`${ContextKeys.AccountPrefix}trial:period`, this.lic.period);
	};


	setMaxTasksReached = async (taskType?: string, force?: boolean) =>
	{
		if (force || ((!this._maxTasksMessageShown && !taskType) || (taskType && !this._maxTaskTypeMsgShown[taskType] && Object.keys(this._maxTaskTypeMsgShown).length < 3)))
		{
			this._maxTasksMessageShown = true;
			if (taskType)
			{
				this._maxTaskTypeMsgShown[taskType] = true;
			}
			const msg = `The max # of parsed ${taskType ?? ""} tasks in un-licensed mode has been reached`;
			return this.displayPopup(msg, "");
		}
	};


	setTestData = (data: any): void =>
	{
		this._maxFreeTasks = data.maxFreeTasks || this._maxFreeTasks;
		this._maxFreeTaskFiles = data.maxFreeTaskFiles || this._maxFreeTaskFiles;
		this._maxFreeTasksForTaskType = data.maxFreeTasksForTaskType || this._maxFreeTasksForTaskType;
		this._maxFreeTasksForScriptType = data.maxFreeTasksForScriptType || this._maxFreeTasksForScriptType;
		this._sessionInterval.tests = data.sessionInterval || this._defaultSessionInterval;
		if (data.callTasksChanged) {
			this.onTasksChanged(data.callTasksChanged);
		}
	};


	submitRegistration = async (params: IpcAccountRegistrationParams): Promise<void> =>
	{
		this.wrapper.log.methodStart("submit registration", 1, "", true, [
			[ "first", params.firstName ], [ "last", params.lastName ], [ "email", params.email ], [ "alt. email", params.emailAlt ]
		]);
		this._busy = true;
		const sbInfo = this._sbInfo = this.wrapper.statusBar.info;
		this.wrapper.statusBar.update("Submitting resgistration");
		await this.executeRequest("register/account", "   ", params);
		this.restoreStatusBar(sbInfo);
		this.wrapper.log.methodDone("submit registration", 1, "");
	};


	private validateLicense = async (key: string, logPad: string): Promise<void> =>
	{
		this.wrapper.log.methodStart("validate license", 1, logPad);
		this._busy = true;
		const sbInfo = this._sbInfo = this.wrapper.statusBar.info;
		this.wrapper.statusBar.update("Validating license");
		await this.executeRequest("license/validate", logPad + "   ", { key });
		this.restoreStatusBar(sbInfo);
		this.wrapper.log.methodDone("validate license", 1, logPad);
	};

}
