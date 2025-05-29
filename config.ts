    /**
     * TypeScript config file
     */
    interface Config {
    apiBaseUrl: string;
    defaultDateFormat: string;
    appName: string;
    features: {
        enablePrinting: boolean;
        enableExports: boolean;
    };
    }

    const config: Config = {
    apiBaseUrl: 'http://localhost:3000',
    defaultDateFormat: 'YYYY-MM-DD',
    appName: 'Akoya Water Park',
    features: {
        enablePrinting: true,
        enableExports: true
    }
    };

    export default config;