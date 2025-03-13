/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;`;

/** @type {import("next").NextConfig} */
const config = {
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-DNS-Prefetch-Control",
                        value: "off",
                    },
                    {
                        key: "X-Download-Options",
                        value: "noopen",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                    {
                        key: "X-Permitted-Cross-Domain-Policies",
                        value: "none",
                    },
                    {
                        key: "X-XSS-Protection",
                        value: "0",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "no-referrer",
                    },
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin",
                    },
                    {
                        key: "Cross-Origin-Resource-Policy",
                        value: "same-origin",
                    },
                    {
                        key: "Origin-Agent-Cluster",
                        value: "?1",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=15552000; includeSubDomains",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: cspHeader.replace(/\n/g, ""),
                    },
                ],
            },
        ];
    },
};

export default config;
