

// import fetch from "node-fetch";
import { v4 as uuid } from "uuid";
import { URLSearchParams } from "url";
import { TeWrapper } from "../wrapper";
import { IDictionary, TeSessionChangeEvent } from "../../interface";
import { PromiseAdapter, promiseFromEvent } from "../utils/promiseUtils";
import {
    authentication, AuthenticationProvider, AuthenticationSession,
    Disposable, env, EventEmitter, ProgressLocation, Uri, UriHandler, window
} from "vscode";

export const AUTH_TYPE = "teauth";
const AUTH_NAME = "TeAuth";
const CLIENT_ID = "1Ac4qiBjXsNQP82FqmeJ5iH7IIw3Bou7eibskqg+Jg0U6rYJ0QhvoWZ+5RpH/Kq0EbIrZ9874fDG9u7bnrQP3zYf69DFkOSnOmz3lCMwEA85ZDn79P+fbRubTS+eDrbinnOdPe/BBQhVW7pYHxeK28tYuvcJuj0mOjIOz+3ZgTY=";
const TEAUTH_DOMAIN = "app1.spmeesseman.com";
const SESSIONS_SECRET_KEY = `${AUTH_TYPE}.sessions`;


/*
    TODO - Remove istanbul tags when sessions are implemented
*/

class UriEventHandler extends EventEmitter<Uri> implements UriHandler
{
    /* istanbul ignore next */
    public handleUri(uri: Uri)
    {
        this.fire(uri);
    }
}


export class TeAuthenticationProvider implements AuthenticationProvider, Disposable
{

    private _disposable: Disposable;
    private _uriHandler: UriEventHandler;
    private _pendingStates: string[] = [];
    private _authApiEndpoint = "/api/license/validate/v1";
    private _onSessionChange: EventEmitter<TeSessionChangeEvent>;
    private _codeExchangePromises: IDictionary<{ promise: Promise<string>; cancel: EventEmitter<void> }> = {};


    constructor(private readonly wrapper: TeWrapper)
    {
        this._uriHandler = new UriEventHandler();
        this._onSessionChange = new EventEmitter<TeSessionChangeEvent>();
        this._disposable = Disposable.from(
            this._uriHandler,
            this._onSessionChange,
            authentication.registerAuthenticationProvider(AUTH_TYPE, AUTH_NAME, this, { supportsMultipleAccounts: false }),
            window.registerUriHandler(this._uriHandler)
        );
    }


    dispose()
    {
        this._disposable.dispose();
    }


    get apiEndpoint() {
        return this._authApiEndpoint;
    }

    get onDidChangeSessions() {
        return this._onSessionChange.event;
    }


    /* istanbul ignore next */
    get redirectUri() {
        const publisher = this.wrapper.context.extension.packageJSON.publisher;
        const name = this.wrapper.context.extension.packageJSON.name;
        return `${env.uriScheme}://${publisher}.${name}`;
    }


    public async getSessions(scopes?: string[]): Promise<readonly AuthenticationSession[]>
    {
        const allSessions = await this.wrapper.storage.getSecret(SESSIONS_SECRET_KEY);
        if (allSessions)
        {
            return JSON.parse(allSessions) as AuthenticationSession[];
        }
        return [];
    }


    /* istanbul ignore next */
    public async createSession(scopes: string[]): Promise<AuthenticationSession>
    {
        try
        {   const token = await this.login(scopes);
            if (!token) {
                throw new Error("TeAuth login failure");
            }

            const userinfo: { name: string; email: string } = await this.getUserInfo(token);
            const session: AuthenticationSession = {
                id: uuid(),
                accessToken: token,
                account: {
                    label: userinfo.name,
                    id: userinfo.email
                },
                scopes: []
            };

            await this.wrapper.storage.updateSecret(SESSIONS_SECRET_KEY, JSON.stringify([ session ]));
            this._onSessionChange.fire({ added: [ session ], removed: [], changed: [] });
            return session;
        }
        catch (e)
        {
            window.showErrorMessage(`Sign in failed: ${e}`);
            throw e;
        }
    }


    /* istanbul ignore next */
    public async removeSession(sessionId: string): Promise<void>
    {
        const allSessions = await this.wrapper.storage.getSecret(SESSIONS_SECRET_KEY);
        if (allSessions)
        {
            const sessions = JSON.parse(allSessions) as AuthenticationSession[];
            const sessionIdx = sessions.findIndex(s => s.id === sessionId);
            const session = sessions[sessionIdx];
            sessions.splice(sessionIdx, 1);
            await this.wrapper.storage.updateSecret(SESSIONS_SECRET_KEY, JSON.stringify(sessions));
            if (session) {
                this._onSessionChange.fire({ added: [], removed: [ session ], changed: [] });
            }
        }
    }


    /* istanbul ignore next */
    private login(scopes: string[] = [])
    {
        return window.withProgress<string>({
            location: ProgressLocation.Notification,
            title: "Signing in to TeAuth...",
            cancellable: true
        },
        async (_, token) =>
        {
            const stateId = uuid();

            this._pendingStates.push(stateId);

            const scopeString = scopes.join(" ");

            if (!scopes.includes("openid"))
            {
                scopes.push("openid");
            }
            if (!scopes.includes("profile"))
            {
                scopes.push("profile");
            }
            if (!scopes.includes("email"))
            {
                scopes.push("email");
            }

            const searchParams = new URLSearchParams([
                [ "response_type", "token" ],
                [ "client_id", CLIENT_ID ],
                [ "redirect_uri", this.redirectUri ],
                [ "state", stateId ],
                [ "scope", scopes.join(" ") ],
                [ "prompt", "login" ]
            ]);
            const uri = Uri.parse(`https://${TEAUTH_DOMAIN}/authorize?${searchParams.toString()}`);
            await env.openExternal(uri);

            let codeExchangePromise = this._codeExchangePromises[scopeString];
            if (!codeExchangePromise)
            {
                codeExchangePromise = promiseFromEvent(this._uriHandler.event, this.handleUri(scopes));
                this._codeExchangePromises[scopeString] = codeExchangePromise;
            }

            try
            {
                return await Promise.race([
                    codeExchangePromise.promise,
                    new Promise<string>((_, reject) => setTimeout(() => reject("Cancelled"), 60000)),
                    promiseFromEvent<any, any>(token.onCancellationRequested, (_, __, reject) => { reject("User Cancelled"); }).promise
                ]);
            } finally
            {
                this._pendingStates = this._pendingStates.filter(n => n !== stateId);
                codeExchangePromise?.cancel.fire();
                delete this._codeExchangePromises[scopeString];
            }
        });
    }


    /* istanbul ignore next */
    private handleUri: (scopes: readonly string[]) => PromiseAdapter<Uri, string> =
        (scopes) => async (uri, resolve, reject) =>
        {
            const query = new URLSearchParams(uri.fragment);
            const token = query.get("access_token");
            const state = query.get("state");

            if (!token)
            {
                reject(new Error("No token"));
                return;
            }
            if (!state)
            {
                reject(new Error("No state"));
                return;
            }

            // Check if it is a valid auth request started by the extension
            if (!this._pendingStates.some(n => n === state))
            {
                reject(new Error("State not found"));
                return;
            }

            resolve(token);
        };

    /* istanbul ignore next */
    private async getUserInfo(_token: string): Promise<{ name: string; email: string }>
    {
        // const response = await fetch(`https://${TEAUTH_DOMAIN}/userinfo`, {
        //     headers: {
        //         // eslint-disable-next-line @typescript-eslint/naming-convention
        //         Authorization: `Bearer ${token}`
        //     }
        // });
        // return response.json() as Promise<{ name: string; email: string }>;
        return { name: "Test", email: "test@spmeesseman.com" };
    }
}
