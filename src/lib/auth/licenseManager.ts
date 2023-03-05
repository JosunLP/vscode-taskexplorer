
import { TeWrapper } from "../wrapper";
import { ITeApiEndpoint, ServerError, TeServer } from "./server";
import { isScriptType } from "../utils/taskUtils";
import { executeCommand, registerCommand, Commands } from "../command/command";
import { Disposable, env, Event, EventEmitter, InputBoxOptions, window } from "vscode";
import { ITeLicenseManager, TeLicenseType, TeSessionChangeEvent, ITeAccount, ITeTask, ITeSession, ITeTaskChangeEvent } from "../../interface";
import { StorageKeys } from "../constants";


export class LicenseManager implements ITeLicenseManager, Disposable
{
	private _account: ITeAccount;
	private busy = false;
	private maxFreeTasks = 500;
	private maxFreeTaskFiles = 100;
	private maxTasksReached = false;
	private maxFreeTasksForTaskType = 100;
	private maxFreeTasksForScriptType = 50;
	private _errorState = false;
	private readonly _disposables: Disposable[] = [];
	private readonly authService = "vscode-taskexplorer-prod";
    private readonly _onSessionChange: EventEmitter<TeSessionChangeEvent>;


	constructor(private readonly wrapper: TeWrapper)
    {
		this._account = this.getNewAccount();
		this._onSessionChange = new EventEmitter<TeSessionChangeEvent>();
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
		this._disposables.forEach((d) => d.dispose());
	};


	get isBusy() {
		return this.busy;
	}

	get isLicensed() {
		return this._errorState || this.isTrial || this._account.license.type >= TeLicenseType.Standard;
	}

	get isRegistered() {
		return this._account.verified;
	}

	get isTrial() {
		return this._account.license.type === TeLicenseType.Trial || this._account.license.type === TeLicenseType.TrialExtended ||
			   this._account.license.type === TeLicenseType.None;
	}

    get onDidSessionChange(): Event<TeSessionChangeEvent> {
        return this._onSessionChange.event;
    }


	private beginTrial = async(logPad: string) =>
	{
		this.wrapper.log.methodStart("begin trial", 1, logPad);
		try
		{
			this._account = await this.wrapper.server.request<ITeAccount>("register/trial/start", logPad + "   ",
			{
				machineId: env.machineId,
				appName: this.authService
			});
			await this.saveAccount(logPad + "   ");
		}
		catch (e) {
			this.handleServerError(e);
		}
		this.wrapper.log.methodDone("begin trial", 1, logPad);
	};


	checkLicense = async(logPad: string) =>
	{
		this.busy = true;
		this._errorState = false;
		this._account = await this.getAccount();

		this.wrapper.statusBar.update("Checking license");
		this.wrapper.log.methodStart("license manager check license", 1, logPad, false, [
			[ "stored session id", this._account.id ], [ "machine id", env.machineId ]
		]);

		if (this._account.license.type !== TeLicenseType.None)
		{
			if (this._account.license.key && this._account.license.type !== TeLicenseType.Free)
			{
				await this.validateLicense(this._account.license.key, logPad + "   ");
			}
			else {
				await this.displayPopup(logPad + "   ");
			}
		}
		else {
			await this.beginTrial(logPad + "   ");
		}

		this.busy = false;
		this.wrapper.statusBar.update("");
		this.wrapper.log.methodDone("license manager check license", 1, logPad, [[ "is licensed", this.isLicensed ]]);
	};


	private displayPopup = async (logPad: string) =>
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
			if (this._account.license.type !== TeLicenseType.TrialExtended) {
				options.push("Extend Trial");
			}
			await this.wrapper.storage.update("taskexplorer.lastLicenseNag", Date.now().toString());
			window.showInformationMessage("Purchase a license to unlock unlimited parsed tasks.", ...options)
			.then(async (action) =>
			{
				if (action === "Enter License Key")
				{
					await this.enterLicenseKey(); // don't await
				}
				else if (action === "Extend Trial")
				{
					await this.extendTrial(logPad + "   ");
				}
				else if (action === "Info")
				{
					await executeCommand(Commands.ShowLicensePage);
				}
			});
		}

		this.wrapper.log.methodDone("license manager display popup", 1, logPad);
	};


	private enterLicenseKey = async() =>
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
						if (this.maxTasksReached) {
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


	private extendTrial = async(logPad: string) =>
	{
		let token: string | undefined;
		this.busy = true;

		this.wrapper.log.methodStart("request license", 1, logPad);

		if (await this.wrapper.storage.getSecret("taskexplorer.licenseKey30Day") !== undefined)
		{   // this.log("   a 30-day license has already been allocated to this machine", logPad);
			this.busy = false;
			return;
		}

		this.wrapper.statusBar.update("Requesting extended trial license");

		try
		{
			const rsp = await this.wrapper.server.request<ITeSession>(
				"register/trial/extend", logPad,
				{
					ttl: 30,
					appId: env.machineId,
					machineId: env.machineId,
					appName: "vscode-taskexplorer",
					ip: "*",
					json: true,
					license: true,
					tests: this.wrapper.tests
				}
			);

			this._account.session = rsp;
			await this.wrapper.storage.updateSecret("taskexplorer.licenseKey30Day", token);
			await this.saveAccount("   ");
		}
		catch (e) {
			this.handleServerError(e);
		}

		this.busy = false;
		this.wrapper.statusBar.update("");
		this.wrapper.log.methodDone("request license", 1, logPad, [[ "30-day key", token ]]);
		return token;
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
				type: TeLicenseType.None
			}
		};
	};


	private getAccount = (): Thenable<ITeAccount> =>
		this.wrapper.storage.getSecret<ITeAccount>(StorageKeys.Account, this._account);


	getMaxNumberOfTasks = (taskType?: string) =>
		(this.isLicensed ? Infinity : (!taskType ? this.maxFreeTasks :
						(isScriptType(taskType) ? this.maxFreeTasksForScriptType : this.maxFreeTasksForTaskType)));


	getMaxNumberOfTaskFiles = () =>  (this.isLicensed ? Infinity : this.maxFreeTaskFiles);


	private handleServerError = (e: Error | ServerError) =>
	{
		if (e instanceof ServerError) {
			this.wrapper.log.error(e, [[ "status code", e.status ]]);
		}
		else {
			this.wrapper.log.error(e);
		}
		this._errorState = true;
		this.wrapper.statusBar.update("Error");
		setTimeout(() => this.wrapper.statusBar.update(""), 1500);
	};


	private onSessionChanged = (e: TeSessionChangeEvent) => this._onSessionChange.fire(e);


	private onTasksChanged = (e: ITeTaskChangeEvent) =>
	{
		this.wrapper.log.methodOnce("license event", "on tasks changed", 1, "");
	};


	private register = async() =>
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
		}
		await this.wrapper.storage.updateSecret(StorageKeys.Account, JSON.stringify(this._account));
		this.onSessionChanged({ added: [ this._account.session ], removed: [], changed: [] });
		this.wrapper.log.methodDone("save account", 1, logPad);
	};


	setMaxTasksReached = (maxReached: boolean) => this.maxTasksReached = maxReached;


	setTestData = (data: any) =>
	{
		this.maxFreeTasks = data.maxFreeTasks;
		this.maxFreeTaskFiles = data.maxFreeTaskFiles;
		this.maxFreeTasksForTaskType = data.maxFreeTasksForTaskType;
		this.maxFreeTasksForScriptType = data.maxFreeTasksForScriptType;
	};


	private validateLicense = async(key: string, logPad: string) =>
	{
		this.wrapper.log.methodStart("validate license", 1, logPad);
		try
		{
			this._account.session = await this.wrapper.server.request<ITeSession>("license/validate", logPad,
			{
				key,
				machineId: env.machineId,
				appName: "vscode-taskexplorer-prod"
			});
			await this.saveAccount("   ");
			this.wrapper.statusBar.update("");
		}
		catch (e) {
			this.handleServerError(e);
		}
		this.wrapper.log.methodDone("validate license", 1, logPad);
	};

}
