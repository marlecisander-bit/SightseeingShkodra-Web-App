window.app = window.app || {};

window.app.supabase = {
    getClient() {
        if (!this.client) {
            const sdk = window.supabase.createClient(window.location.origin, 'live-map-workspace', {
                accessToken: async () => null,
                global: {
                    fetch(input, init) {
                        const url = new URL(input);
                        const prefix = '/rest/v1/';
                        if (url.origin !== window.location.origin || !url.pathname.startsWith(prefix)) {
                            throw new Error('Unsupported tracking request');
                        }
                        const headers = new Headers(init?.headers);
                        headers.delete('authorization');
                        headers.delete('apikey');
                        headers.set('X-Live-Map-Workspace', '1');
                        return fetch(window.appConfig.workspaceDataPath + url.pathname.slice(prefix.length) + url.search, {
                            ...init, headers, credentials: 'same-origin', cache: 'no-store',
                        });
                    },
                },
            });
            // Use the existing visible-page snapshot polling without a browser tracking token.
            this.client = { from: sdk.from.bind(sdk), rpc: sdk.rpc.bind(sdk) };
        }
        return this.client;
    },
    init() { return this.getClient(); },
};

window.app.supabaseClient = window.app.supabase.getClient.bind(window.app.supabase);
