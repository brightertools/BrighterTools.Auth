import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReCaptchaEnterpriseOptions, UseReCaptchaEnterpriseResult } from "../types/recaptcha";

declare global {
    interface Window {
        grecaptcha?: {
            enterprise?: {
                ready: (callback: () => void) => void;
                execute: (siteKey: string, options: { action: string }) => Promise<string>;
            };
        };
    }
}

const DEFAULT_SCRIPT_URL = "https://www.google.com/recaptcha/enterprise.js";

export const useReCaptchaEnterprise = (options: ReCaptchaEnterpriseOptions): UseReCaptchaEnterpriseResult => {
    const [loaded, setLoaded] = useState(false);

    const enabled = useMemo(() => {
        return options.enabled !== false && !!options.siteKey;
    }, [options.enabled, options.siteKey]);

    useEffect(() => {
        if (!enabled) {
            setLoaded(true);
            return;
        }

        if (typeof window === "undefined") {
            return;
        }

        if (window.grecaptcha?.enterprise) {
            window.grecaptcha.enterprise.ready(() => setLoaded(true));
            return;
        }

        const scriptUrl = `${options.scriptUrl ?? DEFAULT_SCRIPT_URL}?render=${options.siteKey}`;
        const existing = document.querySelector<HTMLScriptElement>(`script[src=\"${scriptUrl}\"]`);
        if (existing) {
            existing.addEventListener("load", () => setLoaded(true));
            return;
        }

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.grecaptcha?.enterprise) {
                window.grecaptcha.enterprise.ready(() => setLoaded(true));
            }
        };

        document.head.appendChild(script);
    }, [enabled, options.scriptUrl, options.siteKey]);

    const generateToken = useCallback(async (action: string): Promise<string> => {
        if (!enabled) {
            return "";
        }

        if (!options.siteKey || !window.grecaptcha?.enterprise || !loaded) {
            return "";
        }

        try {
            return await window.grecaptcha.enterprise.execute(options.siteKey, { action });
        } catch {
            return "";
        }
    }, [enabled, loaded, options.siteKey]);

    return {
        enabled,
        loaded,
        generateToken
    };
};
