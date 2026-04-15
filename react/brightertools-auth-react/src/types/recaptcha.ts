export interface ReCaptchaEnterpriseOptions {
    enabled?: boolean;
    siteKey?: string;
    scriptUrl?: string;
}

export interface UseReCaptchaEnterpriseResult {
    enabled: boolean;
    loaded: boolean;
    generateToken: (action: string) => Promise<string>;
}
