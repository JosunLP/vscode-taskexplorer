
import { TeWrapper } from "../wrapper";
import { ITeLicenseManager } from "../../interface";
import { isScriptType } from "../utils/taskUtils";
import { IServerResponseData, TeServer } from "./server";
import { TeAuthenticationProvider } from "./authProvider";
import { executeCommand, registerCommand, Commands } from "../command/command";
import { ISessionToken, TeSessionChangeEvent } from "../../interface/IAuthentication";
import { AuthenticationSession, Disposable, env, Event, EventEmitter, InputBoxOptions, Task, window } from "vscode";


export class LicenseManager implements ITeLicenseManager, Disposable
{
	private numTasks = 0;
	private busy = false;
	private trial = false;
	private licensed = false;
	private registered = false;
	private maxFreeTasks = 500;
	private maxFreeTaskFiles = 100;
	private maxTasksReached = false;
	private maxFreeTasksForTaskType = 100;
	private maxFreeTasksForScriptType = 50;
	private readonly _server: TeServer;
	private readonly _disposables: Disposable[] = [];
	private readonly _auth: TeAuthenticationProvider;
    private readonly _onSessionChange: EventEmitter<TeSessionChangeEvent>;


	constructor(private readonly wrapper: TeWrapper)
    {
		this._server = new TeServer(wrapper);
		this._auth = new TeAuthenticationProvider(wrapper);
		this._auth.onDidChangeSessions(this.onSessionChanged);
		this._onSessionChange = new EventEmitter<TeSessionChangeEvent>();
		this._disposables.push(
			this._auth,
			this._onSessionChange,
			registerCommand(Commands.EnterLicense, this.enterLicenseKey, this),
			registerCommand(Commands.ExtendTrial, this.extendTrial, this),
			registerCommand(Commands.Register, this.register, this)
		);
    }


	dispose = () =>
	{
		this._disposables.forEach((d) => d.dispose());
		this.numTasks = 0;
	};


	get isBusy() {
		return this.busy;
	}

	get isLicensed() {
		return this.licensed;
	}

	get isRegistered() {
		return this.registered;
	}

	get isTrial() {
		return this.trial;
	}

    get onDidSessionChange(): Event<TeSessionChangeEvent> {
        return this._onSessionChange.event;
    }

	get server(): TeServer {
		return this._server;
	}

	get serverToken(): string {
		return this.wrapper.server.serverToken;
	}


	beginTrial = async() =>
	{
		this.wrapper.log.methodStart("get trial license command", 1, "", true);
		const newKey = await this.requestLicense("trial", "   ");
		const panel = await this.wrapper.licensePage.show(undefined, newKey);
		this.wrapper.log.methodDone("get trial license command", 1);
		return { panel: panel.view, newKey };
	};


	checkLicense = async(logPad = "   ") =>
	{
		const storedLicenseKey = await this.getLicenseKey();
		this.wrapper.log.methodStart("license manager check license", 1, logPad, false, [
			[ "license key", storedLicenseKey ?? "n/a" ], [ "machine id", env.machineId ]
		]);
		if (storedLicenseKey) {
			this.licensed = await this.validateLicense(storedLicenseKey, logPad + "   ");
		}
		else {
			this.licensed = false;
		}
		this.wrapper.log.methodDone("license manager check license", 1, logPad, [[ "is licensed", this.licensed ]]);
	};


	private displayPopup = async (message: string) =>
	{
		await this.wrapper.storage.update("taskexplorer.lastLicenseNag", Date.now().toString());
		window.showInformationMessage(message, "Enter License Key", "Info", "Not Now")
		.then(async (action) =>
		{
			if (action === "Enter License Key")
			{
				await this.enterLicenseKey(); // don't await
			}
			else if (action === "Info")
			{
				await executeCommand(Commands.ShowLicensePage);
			}
		});
	};


	enterLicenseKey = async() =>
	{
		this.wrapper.log.methodStart("enter license key", 1);
		const opts: InputBoxOptions = { prompt: "Enter license key" };
		try {
			const input = await window.showInputBox(opts);
			if (input)
			{
				if (input.length > 20)
				{
					this.licensed = await this.validateLicense(input, "   ");
					if (this.licensed)
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


	extendTrial = async() =>
	{
		this.wrapper.log.methodStart("get trial extension license command", 1, "", true);
		const newKey = await this.requestLicense("30Day", "   ");
		const panel = await this.wrapper.licensePage.show(undefined, newKey);
		this.wrapper.log.methodDone("get trial extension license command", 1);
		return { panel: panel.view, newKey };
	};


	getLicenseKey = () => this.wrapper.storage.getSecret("taskexplorer.licenseKey"); // for now, "1234-5678-9098-7654321" is a valid license


	getLicenseToken = async(): Promise<ISessionToken | undefined> =>
	{
		const token = await this.wrapper.storage.getSecret("taskexplorer.licenseToken");
		return token ? JSON.parse(token) as ISessionToken : undefined;
	};


	getMaxNumberOfTasks = (taskType?: string) =>
		(this.licensed ? Infinity : (!taskType ? this.maxFreeTasks :
						(isScriptType(taskType) ? this.maxFreeTasksForScriptType : this.maxFreeTasksForTaskType)));


	getMaxNumberOfTaskFiles = () =>  (this.licensed ? Infinity : this.maxFreeTaskFiles);


	getSession = async(): Promise<AuthenticationSession |  undefined> =>  (await this._auth.getSessions())[0];


	private onSessionChanged = (e: TeSessionChangeEvent) => this._onSessionChange.fire(e);


	register = async() =>
	{
		await this.wrapper.utils.timeout(1);
		// this.wrapper.log.methodStart("register command", 1, "", true);
		// const newKey = await this.requestLicense("   ");
		// const panel = await this.wrapper.licensePage.show(undefined, newKey);
		// // this.wrapper.utils.openUrl("https://app1.spmeesseman.com/register");
		// this.wrapper.log.methodDone("register command", 1);
		// return { panel: panel.view, newKey };
	};


	requestLicense = async(type: "trial" | "30Day", logPad: string) =>
	{
		let token: string | undefined;
		this.busy = true;

		this.wrapper.log.methodStart("request license", 1, logPad);

		if (await this.wrapper.storage.getSecret(`taskexplorer.licenseKey${type}`) !== undefined)
		{   // this.log("   a 30-day license has already been allocated to this machine", logPad);
			this.busy = false;
			return;
		}

		this.wrapper.statusBar.update(`Requesting ${type} license`);

		const rsp = await this.wrapper.server.request("/token",
		{
			ttl: 30,
			appid: env.machineId,
			appname: "vscode-taskexplorer",
			ip: "*",
			json: true,
			license: true,
			tests: this.wrapper.tests
		},
		logPad);

		/* istanbul ignore else */
		if (rsp.success === true && rsp.data && this.wrapper.utils.isObject(rsp.data.token))
		{
			token = rsp.data.token.token;
			await this.setLicenseKeyFromRsp(rsp.data, logPad);
			await this.wrapper.storage.updateSecret("taskexplorer.licenseKey30Day", token);
		}

		this.busy = false;
		this.wrapper.statusBar.update("");
		this.wrapper.log.methodDone("request license", 1, logPad, [[ "30-day key", token ]]);
		return token;
	};


	setLicenseKey = async (licenseKey: string | undefined) =>
	{
		await this.wrapper.storage.updateSecret("taskexplorer.licenseKey", licenseKey);
		// this.onSessionChanged({
		// 	added: [],
		// 	removed: [],
		// 	changed: [],
		// 	token: undefined
		// });
	};


	setLicenseToken = async (licenseToken: ISessionToken | undefined) =>
	{
		await this.wrapper.storage.updateSecret("taskexplorer.licenseToken", licenseToken ? JSON.stringify(licenseToken) : undefined);
		this.onSessionChanged({
			added: [ await this.getSession() as AuthenticationSession ],
			removed: [],
			changed: [],
			token: licenseToken
		});
	};


	private setLicenseKeyFromRsp = async(jso: IServerResponseData, logPad: string) =>
	{
		const token = jso.token as ISessionToken;
		this.wrapper.log.value("license key", token.token, 1, logPad);
		this.wrapper.log.value("   issued", token.issuedFmt, 1, logPad);
		this.wrapper.log.value("   expires", token.expiresFmt /* || jso.expiresFmt */, 1, logPad);
		await this.setLicenseKey(token.token);
		await this.setLicenseToken(token);
		this.wrapper.log.write("license key saved to secure storage", 1, logPad);
	};


	setMaxTasksReached = (maxReached: boolean) => this.maxTasksReached = maxReached;


	setTasks = async(tasks: Task[], logPad = "   ") =>
	{
		if (this.numTasks === tasks.length) {
			return;
		}
		this.numTasks = tasks.length;

		const lastNag = this.wrapper.storage.get<string>("taskexplorer.lastLicenseNag");
		this.wrapper.log.methodStart("license manager set tasks", 1, logPad, false, [
			[ "is licensed", this.licensed ], [ "is version change", this.wrapper.versionchanged ],
			[ "# of tasks", this.numTasks ], [ "last nag", lastNag ]
		]);

		//
		// Only display the nag on startup once every 30 days.  If the version
		// changed, the webview will be shown instead regardless of the nag state.
		//
		let displayPopup = !this.licensed;
		if (displayPopup && lastNag)
		{
			const now = Date.now(),
				  lastNagDate = parseInt(lastNag, 10);
			displayPopup = ((now - lastNagDate)  / 1000 / 60 / 60 / 24) > 30;
		}

		if (displayPopup) {
			this.displayPopup("Purchase a license to unlock unlimited parsed tasks.");
		}

		this.wrapper.log.methodDone("license manager set tasks", 1, logPad);
	};


	setTestData = (data: any) =>
	{
		this.maxFreeTasks = data.maxFreeTasks;
		this.maxFreeTaskFiles = data.maxFreeTaskFiles;
		this.maxFreeTasksForTaskType = data.maxFreeTasksForTaskType;
		this.maxFreeTasksForScriptType = data.maxFreeTasksForScriptType;
	};


	private validateLicense = async(licenseKey: string, logPad: string) =>
	{
		this.busy = true;
		let licensed = false;

		this.wrapper.statusBar.update("Checking license mode");

		const rsp = await this.wrapper.server.request(this._auth.apiEndpoint,
		{
			licensekey: licenseKey,
			appid: env.machineId,
			appname: "vscode-taskexplorer-prod",
			ip: "*"
		},
		logPad);

		licensed = rsp.success;

		this.busy = false;
		this.wrapper.statusBar.update("");
		this.wrapper.log.methodDone("validate license", 1, logPad, [[ "is valid license", licensed ]]);
		return licensed;
	};

}
