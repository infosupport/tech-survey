import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */

export default defineConfig({
    testDir: "./tests",
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env["CI"],
    retries: 0,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [["list", { printSteps: true }], ["html"]],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "on-first-retry",
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

    /* No webserver config, webserver is started within the tests */
});
