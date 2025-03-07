import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */

// Use process.env.PORT by default and fallback to port 3000
const PORT = process.env.PORT ?? 4567;

// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const baseURL = `http://localhost:4567`;

export default defineConfig({
    testDir: "./tests",
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: 1,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [["list", { printSteps: true }], ["html"]],

    webServer: {
        command: "npm run dev -- -p 4567",
        url: baseURL,
        timeout: 30 * 1000,
        reuseExistingServer: !process.env.CI,
        env: {
            DATABASE_URL: "postgresql://test:test@localhost:32769/test",
        },
    },

    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        baseURL,
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "retry-with-trace",
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: "chromium",
            grepInvert: /(Mobile)/,
            use: {
                ...devices["Desktop Chrome"],
            },
        },

        // Mobile devices
        {
            name: "android",
            grep: /(Mobile)/,
            use: {
                ...devices["Pixel 5"],
            },
        },
    ],
});
