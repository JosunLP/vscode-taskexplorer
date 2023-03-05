
import { TeWrapper } from "./wrapper";
import { ITeApiEndpoint, ServerError } from "./server";
import { StorageKeys } from "./constants";
import { isScriptType } from "./utils/taskUtils";
import { executeCommand, registerCommand, Commands } from "./command/command";
import { Disposable, Event, EventEmitter, InputBoxOptions, window } from "vscode";
import {
	 ITeLicenseManager, TeLicenseType, TeSessionChangeEvent, ITeAccount, ITeSession, ITeTaskChangeEvent,
	 ITeLicense, TeLicenseState
} from "../interface";


export class LicenseManager implements ITeLicenseManager, Disposable
{
	private _account: ITeAccount;
	private _busy = false;
	private _maxFreeTasks = 500;
	private _maxFreeTaskFiles = 100;
	private _maxTasksReached = false;
	private _maxFreeTasksForTaskType = 100;
	private _maxFreeTasksForScriptType = 50;
	private _checkLicenseTask: NodeJS.Timeout;
	private readonly _disposables: Disposable[] = [];
	private readonly _checkLicenseInterval = 1000 * 60 * 60 * 4; // 4 hr
    private readonly _onSessionChange: EventEmitter<TeSessionChangeEvent>;


	constructor(private readonly wrapper: TeWrapper)
    {
		this._account = this.getNewAccount();
		this._onSessionChange = new EventEmitter<TeSessionChangeEvent>();
		// eslint-disable-next-line @typescript-eslint/tslint/config
		this._checkLicenseTask = setInterval(this.checkLicense, this._checkLicenseInterval, "");
		this._disposables.push(
			this._onSessionChange,
			this.wrapper.treeManager.onDidTaskCountChange(this.onTasksChanged),
			registerCommand(Commands.EnterLicense, this.enterLicenseKey, this),
			registerCommand(Commands.ExtendTrial, this.extendTrial, this),
			registerCommand(Commands.Register, this.register, this)
		);
    }


	dispose = () =>
	{
		clearInterval(this._checkLicenseTask);
		this._disposables.forEach((d) => d.dispose());
	};


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


	private beginTrial = async(logPad: string): Promise<void> =>
	{
		const ep: ITeApiEndpoint = "register/trial/start";
		this.wrapper.log.methodStart("begin trial", 1, logPad);
		try
		{
			this._account = await this.wrapper.server.request<ITeAccount>(ep, logPad + "   ");
			await this.saveAccount(logPad + "   ");
			window.showInformationMessage("Welcome to Task Explorer 3.0.  Your 30 day trial has been activated.");
		}
		catch (e) {
			this.handleServerError(e);
		}
		this.wrapper.log.methodDone("begin trial", 1, logPad);
	};


	checkLicense = async(statusMessage = "Checking license", logPad = ""): Promise<void> =>
	{
		this._busy = true;
		this._account.errorState = false;

		this.wrapper.statusBar.update(statusMessage);
		this.wrapper.log.methodStart("license manager check license", 1, logPad);

		this._account = await this.getAccount();

		if (this._account.license.type !== TeLicenseType.None)
		{
			if (this._account.license.key && this._account.license.type !== TeLicenseType.Free)
			{
				if (this._account.session.expires + this._checkLicenseInterval < Date.now()) {
					await this.validateLicense(this._account.license.key, logPad + "   ");
				}
			}
			else {
				await this.displayPopup(logPad + "   ");
			}
		}
		else {
			await this.beginTrial(logPad + "   ");
		}

		this._busy = false;
		this.wrapper.statusBar.update("");
		this.wrapper.log.methodDone("license manager check license", 1, logPad, [[ "is licensed", this.isLicensed ]]);
	};


	private displayPopup = async (logPad: string): Promise<void> =>
	{
		const lastNag = this.wrapper.storage.get<string>("taskexplorer.lastLicenseNag");
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
			const options = [ "Enter License Key", "Info", "Not Now" ];
			if (this._account.license.type !== TeLicenseType.TrialExtended && this._account.license.type !== TeLicenseType.Free) {
				options.push("Extend Trial");
			}
			await this.wrapper.storage.update("taskexplorer.lastLicenseNag", Date.now().toString());
			window.showInformationMessage("Purchase a license to unlock unlimited parsed tasks.", ...options)
			.then(async (action) =>
			{
				if (action === "Enter License Key")
				{
					// await executeCommand(Commands.EnterLicense);
					executeCommand(Commands.EnterLicense);
				}
				else if (action === "Extend Trial")
				{
					await executeCommand(Commands.ExtendTrial);
				}
				else if (action === "Info")
				{
					await executeCommand(Commands.ShowLicensePage);
				}
			});
		}

		this.wrapper.log.methodDone("license manager display popup", 1, logPad);
	};


	private enterLicenseKey = async(): Promise<void> =>
	{
		this.wrapper.log.methodStart("enter license key", 1);
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
		this.wrapper.log.methodDone("enter license key", 1);
	};


	private extendTrial = async(logPad: string): Promise<void> =>
	{
		const ep: ITeApiEndpoint = "register/trial/extend";
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

		this.wrapper.statusBar.update("Requesting extended trial");

		try
		{
			this._account.license = await this.wrapper.server.request<ITeLicense>(ep, logPad,
			{
				ttl: 30,
				ip: "*",
				json: true,
				license: true,
				tests: this.wrapper.tests
			});
			await this.saveAccount("   ");
		}
		catch (e) {
			this.handleServerError(e);
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


	getAccount = (): Thenable<ITeAccount> =>
		this.wrapper.storage.getSecret<ITeAccount>(StorageKeys.Account, this._account);


	getMaxNumberOfTasks = (taskType?: string): number =>
		(this.isLicensed ? Infinity : (!taskType ? this._maxFreeTasks :
						(isScriptType(taskType) ? this._maxFreeTasksForScriptType : this._maxFreeTasksForTaskType)));


	getMaxNumberOfTaskFiles = (): number =>  (this.isLicensed ? Infinity : this._maxFreeTaskFiles);


	private handleServerError = (e: any): void =>
	{
		if (e instanceof Error) {
			this.wrapper.log.error(e);
		}
		else {
			this.wrapper.log.value("response body", e.body, 2);
			this.wrapper.log.error(e.message, [[ "status code", e.status ]]);
		}
		this._account.errorState = true;
		this.wrapper.statusBar.update("Error");
		setTimeout(() => this.wrapper.statusBar.update(""), 1500);
	};


	private onSessionChanged = (e: TeSessionChangeEvent) => this._onSessionChange.fire(e);


	private onTasksChanged = (_e: ITeTaskChangeEvent) =>
	{
		this.wrapper.log.methodOnce("license event", "on tasks changed", 1, "");
		this.displayPopup("");
	};


	private register = async(): Promise<void> =>
	{
		await this.wrapper.utils.timeout(1);
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
		await this.wrapper.storage.updateSecret(StorageKeys.Account, JSON.stringify(this._account));
		this.onSessionChanged({ added: [ this._account.session ], removed: [], changed: [] });
		this.wrapper.log.methodDone("save account", 1, logPad);
	};


	setMaxTasksReached = (maxReached: boolean): void => { this._maxTasksReached = maxReached; };


	setTestData = (data: any): void =>
	{
		this._maxFreeTasks = data.maxFreeTasks || this._maxFreeTasks;
		this._maxFreeTaskFiles = data.maxFreeTaskFiles || this._maxFreeTaskFiles;
		this._maxFreeTasksForTaskType = data.maxFreeTasksForTaskType || this._maxFreeTasksForTaskType;
		this._maxFreeTasksForScriptType = data.maxFreeTasksForScriptType || this._maxFreeTasksForScriptType;
		if (data.callTasksChanged) {
			this.onTasksChanged({ tasks: [], type: "all" });
		}
	};


	private validateLicense = async(key: string, logPad: string): Promise<void> =>
	{
		const ep: ITeApiEndpoint = "license/validate";
		this.wrapper.log.methodStart("validate license", 1, logPad);
		try
		{
			this._account.session = await this.wrapper.server.request<ITeSession>(ep, logPad, { key });
			await this.saveAccount("   ");
			this.wrapper.statusBar.update("");
		}
		catch (e) {
			this.handleServerError(e);
		}
		this.wrapper.log.methodDone("validate license", 1, logPad);
	};

}
