
import { TeWrapper } from "./wrapper";
import { ITeApiEndpoint } from "./server";
import { executeCommand, registerCommand, Commands } from "./command/command";
import { Disposable, Event, EventEmitter, InputBoxOptions, window } from "vscode";
import {
	ITeLicenseManager, TeLicenseType, TeSessionChangeEvent, ITeAccount, ITeTaskChangeEvent,
	TeLicenseState, IDictionary, TeRuntimeEnvironment
} from "../interface";


export class LicenseManager implements ITeLicenseManager, Disposable
{
	private _account: ITeAccount;
	private _busy = false;
	private _maxFreeTasks = 500;
	private _maxFreeTaskFiles = 100;
	private _maxTasksReached = false;
	private _maxTasksMessageShown = false;
	private _maxFreeTasksForTaskType = 100;
	private _maxFreeTasksForScriptType = 50;
	private _checkLicenseTask: NodeJS.Timeout;
	private readonly _disposables: Disposable[] = [];
	private readonly _maxTaskTypeMsgShown: IDictionary<boolean> = {};
    private readonly _onSessionChange: EventEmitter<TeSessionChangeEvent>;
	private readonly _sessionInterval = <{ [id in TeRuntimeEnvironment]: number}>{
		production: 1000 * 60 * 60 * 24, // 24 hr
		tests: 1000 * 60 * 60 * 24, // 24 hr
		dev: 1000 * 60 * 10 // 5 min
	};


	constructor(private readonly wrapper: TeWrapper)
    {
		this._account = this.getNewAccount();
		this._onSessionChange = new EventEmitter<TeSessionChangeEvent>();
		// eslint-disable-next-line @typescript-eslint/tslint/config
		this._checkLicenseTask = setInterval(this.checkLicense, this.sessionInterval, "");
		this._disposables.push(
			this._onSessionChange,
			this.wrapper.treeManager.onDidTaskCountChange(this.onTasksChanged, this),
			registerCommand(Commands.PurchaseLicense, this.purchaseLicenseKey, this),
			registerCommand(Commands.ExtendTrial, this.extendTrial, this),
			registerCommand(Commands.Register, this.register, this)
		);
    }

	dispose = () =>
	{
		clearInterval(this._checkLicenseTask);
		this._disposables.forEach((d) => d.dispose());
	};


	get account(): ITeAccount {
		return this._account;
	}

	get sessionInterval(): number {
		return this._sessionInterval[this.wrapper.env];
	}

	get isBusy(): boolean {
		return this._busy;
	}

	get isLicensed(): boolean {
		return this._account.errorState || this.isTrial || this._account.license.type >= TeLicenseType.Standard;
	}

	get isRegistered(): boolean {
		return this._account.verified;
	}

	get isTrial(): boolean {
		return this._account.license.state === TeLicenseState.Trial;
	}

    get onDidSessionChange(): Event<TeSessionChangeEvent> {
        return this._onSessionChange.event;
    }

	get statusDays(): string {
		return " (" + (this.isTrial ?
			this.wrapper.utils.getDateDifference(Date.now(), this._account.license.expires, "d") :
			this.wrapper.utils.getDateDifference(Date.now(), this._account.license.expires, "d")) + ")";
	}

    get statusDescription(): string {
        return this.isTrial ? "TRIAL" : (this.isLicensed ? "LICENSED" : "UNLICENSED");
    }


	private beginTrial = async(logPad: string): Promise<void> =>
	{
		const ep: ITeApiEndpoint = "register/trial/start";
		this.wrapper.log.methodStart("begin trial", 1, logPad);
		try
		{
			this._account = await this.wrapper.server.request<ITeAccount>(ep, undefined, logPad + "   ", {});
			await this.saveAccount(logPad + "   ");
			window.showInformationMessage("Welcome to Task Explorer 3.0.  Your 30 day trial has been activated.", "More Info")
			.then((action) =>
			{
				if (action === "More Info") {
					void executeCommand(Commands.ShowLicensePage);
				}
			});
		}
		catch (e) {
			/* istanbul ignore next  */
			await this.handleServerError(e);
		}
		this.wrapper.log.methodDone("begin trial", 1, logPad);
	};


	checkLicense = async(logPad: string): Promise<void> =>
	{
		this._busy = true;
		this._account.errorState = false;
		this.wrapper.statusBar.update("Checking license");
		this.wrapper.log.methodStart("license manager check license", 1, logPad);

		try
		{
			this._account = await this.getStoredAccount();
			this.logAccountFields(logPad + "   ");
			if (this._account.license.type !== TeLicenseType.None)
			{
				if (this._account.license.key && this._account.license.type !== TeLicenseType.Free)
				{
					if (this._account.session.expires <= Date.now() + this.sessionInterval) {
						await this.validateLicense(this._account.license.key, logPad + "   ");
					}
				}
				else {
					await this.displayPopup("Purchase a license to unlock unlimited parsed tasks.", logPad + "   ");
				}
			}
			else {
				await this.beginTrial(logPad + "   ");
			}
		}
		finally  {
			this._busy = false;
			this.wrapper.statusBar.update("");
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
			const options = [ "Info", "Not Now" ];
			if (this._account.license.type !== TeLicenseType.TrialExtended && this._account.license.type !== TeLicenseType.Free) {
				options.push("Extend Trial");
			}
			await this.wrapper.storage.update(this.wrapper.keys.Storage.LastLicenseNag, Date.now().toString());
			const action = await window.showInformationMessage(message, ...options);
			if (action === "Extend Trial")
			{
				await executeCommand(Commands.ExtendTrial);
			}
			else if (action === "Info")
			{
				await executeCommand(Commands.ShowLicensePage, "force"); // use 'force' to ignore the 'busy' flag in WebviewPanel
			}
		}

		this.wrapper.log.methodDone("license manager display popup", 1, logPad);
	};


	private extendTrial = async(logPad: string): Promise<void> =>
	{
		const ep: ITeApiEndpoint = "register/trial/extend",
			  token = this._account.session.token;

		this._busy = true;
		this.wrapper.log.methodStart("request extended trial", 1, logPad, false, [[ "endpoint", ep ]]);

		if (this._account.license.period === 2)
		{
			const msg = "an extended trial license has already been allocated to this machine";
			window.showWarningMessage("Can't proceed - " + msg);
			this.wrapper.log.write("   " + msg, 1, logPad);
			this.wrapper.log.methodDone("request extended trial", 1, logPad);
			this._busy = false;
			return;
		}

		//
		// TODO - Collect name and email address to allow 2nd trial
		//
		const firstName = "Scott",
			  lastName = "Meesseman",
			  email = `spm-${this.wrapper.utils.getRandomNumber()}@gmail.com`;

		this.wrapper.statusBar.update("Requesting extended trial");

		try
		{
			this._account = await this.wrapper.server.request<ITeAccount>(ep, token, logPad,
			{
				accountId: this._account.id,
				email,
				firstName,
				lastName,
				tests: this.wrapper.tests
			});
			await this.saveAccount("   ");
		}
		catch (e) {
			/* istanbul ignore next */
			await this.handleServerError(e);
		}

		this._busy = false;
		this.wrapper.statusBar.update("");
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


	getMaxNumberOfTasks = (taskType?: string): number =>
		(this.isLicensed ? Infinity : (!taskType ? this._maxFreeTasks :
						(this.wrapper.taskUtils.isScriptType(taskType) ? this._maxFreeTasksForScriptType : this._maxFreeTasksForTaskType)));


	getMaxNumberOfTaskFiles = (): number =>  (this.isLicensed ? Infinity : this._maxFreeTaskFiles);


	private handleServerError = async(e: any): Promise<void> =>
	{
		/* istanbul ignore if  */
		if (e instanceof Error)
		{
			this.wrapper.log.error(e);
			this._account.errorState = true; // In error state, licensed mode is ON
		}
		else //
		{   // Possible Status Codes:
			//
			//     201  : Success
			//     400  : Client Error (Invalid Parameters)
			//     402  : Payment required, trial extension already granted
			//     406  : Invalid License Key
			//     408  : Timeout
			//     409  : License/Account/Trial Record Not Found
			//     500  : Server Error
			//
			this.wrapper.log.value("response body", e.body, 2);
			this.wrapper.log.error(e.message, [[ "status code", e.status ]]);
			if (e.status === 402 || e.status === 406 || e.status === 409)
			{
				switch (e.message)
				{
					case "Account does not exist":           // 409
					case "Account trial does not exist":     // 409
					case "Account license does not exist":   // 409
						this._account.license.type = TeLicenseType.Free;
						this._account.license.state = TeLicenseState.Free;
						this._account.verified = false;
						break;
					case "Account trial cannot be extended": // 402
					case "Invalid license key":              // 406
					default:
						this._account.license.type = TeLicenseType.Free;
						this._account.license.state = TeLicenseState.Free;
						break;
				}
				await this.saveAccount("   ");
			}
			else {
				this._account.errorState = true; // In error state, licensed mode is ON
			}
		}

		this.wrapper.statusBar.update("License validation error");
		setTimeout(() => this.wrapper.statusBar.update(""), 1500);
	};


	private logAccountFields = (logPad: string) =>
	{
		const _v = (e: [ string, any ]) => {
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


	private onSessionChanged = (e: TeSessionChangeEvent) => this._onSessionChange.fire(e);


	private onTasksChanged = (e: ITeTaskChangeEvent) =>
	{
		this.wrapper.log.methodOnce("license event", "on tasks changed", 1, "");
		if (e.tasks.length > this.getMaxNumberOfTasks(e.task?.source)) {
			this.setMaxTasksReached();
			this.displayPopup("Purchase a license to unlock unlimited parsed tasks.", "");
		}
	};


	private purchaseLicenseKey = async(): Promise<void> =>
	{
		this.wrapper.log.methodStart("purchase license key", 1);
		const opts: InputBoxOptions = { prompt: "Enter license key" };
		try {
			const input = await window.showInputBox(opts);
			if (input)
			{
				if (input.length > 20)
				{
					await this.validateLicense(input, "   ");
					if (this.isLicensed)
					{
						window.showInformationMessage("License key validated, thank you for your support!");
						if (this._maxTasksReached) {
							this._maxTasksReached = false;
							await executeCommand(Commands.Refresh);
						}
					}
				}
				else {
					window.showInformationMessage("This does not appear to be a valid license, validation skipped");
				}
			}
		}
		catch (e) {}
		this.wrapper.log.methodDone("purchase license key", 1);
	};


	private register = async(): Promise<void> =>
	{
		await this.wrapper.utils.sleep(1);
		// TODO - Account registration
		//        Need webview app to input first/last name, email address
		await window.showInformationMessage("Not implemented yet");
	};


	private saveAccount = async (logPad: string): Promise<void> =>
	{
		this.wrapper.log.methodStart("save account", 1, logPad);
		this.wrapper.log.values(1, logPad + "   ", [
			[ "account id", this._account.id ],
			[ "license issued", this.wrapper.utils.formatDate(this._account.session.issued) ],
			[ "license expires", this.wrapper.utils.formatDate(this._account.session.expires) ]
		]);
		/* istanbul ignore else */
		if (this.wrapper.env !== "production")
		{
			this.wrapper.log.values(1, logPad + "   ", [
				[ "license id", this._account.license.id ], [ "trial id", this._account.trialId ],
				[ "access token", this._account.session.token ], [ "license key", this._account.license.key ]
			]);
			/* istanbul ignore if */
			if (this.wrapper.env === "dev") {
				const rPath = await this.wrapper.pathUtils.getInstallPath() + "\\dist\\account_saved.json";
				await this.wrapper.fs.writeFile(rPath, JSON.stringify(this._account, null, 3));
			}
		}
		await this.wrapper.storage.updateSecret(this.wrapper.keys.Storage.Account, JSON.stringify(this._account));
		this.onSessionChanged({ added: [ this._account.session ], removed: [], changed: [] });
		this.wrapper.log.methodDone("save account", 1, logPad);
	};


	setTestData = (data: any): void =>
	{
		this._maxFreeTasks = data.maxFreeTasks || this._maxFreeTasks;
		this._maxFreeTaskFiles = data.maxFreeTaskFiles || this._maxFreeTaskFiles;
		this._maxFreeTasksForTaskType = data.maxFreeTasksForTaskType || this._maxFreeTasksForTaskType;
		this._maxFreeTasksForScriptType = data.maxFreeTasksForScriptType || this._maxFreeTasksForScriptType;
		this._sessionInterval.tests = data.sessionInterval || (1000 * 60 * 60 * 24);
		if (data.callTasksChanged) {
			this.onTasksChanged(data.callTasksChanged);
		}
	};


	setMaxTasksReached = async(taskType?: string, force?: boolean) =>
	{
		this._maxTasksReached = true;
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


	private validateLicense = async(key: string, logPad: string): Promise<void> =>
	{
		const ep: ITeApiEndpoint = "license/validate",
			  token = this._account.session.token;
		this.wrapper.log.methodStart("validate license", 1, logPad);
		try
		{
			this._account = await this.wrapper.server.request<ITeAccount>(ep, token, logPad, { key });
			await this.saveAccount("   ");
			this.wrapper.statusBar.update("");
		}
		catch (e) {
			await this.handleServerError(e);
		}
		this.wrapper.log.methodDone("validate license", 1, logPad);
	};

}
