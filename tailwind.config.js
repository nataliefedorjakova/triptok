const customDarkTheme = {
  mydark: {
    "color-scheme": "dark",
    "--color-base-100": "oklch(14% 0.005 285.823)",
    "--color-base-200": "oklch(21% 0.006 285.885)",
    "--color-base-300": "oklch(27% 0.006 286.033)",
    "--color-base-content": "oklch(96% 0.001 286.375)",
    "--color-primary": "oklch(52% 0.105 223.128)",
    "--color-primary-content": "oklch(94% 0.029 294.588)",
    "--color-secondary": "oklch(82% 0.111 230.318)",
    "--color-secondary-content": "oklch(29% 0.066 243.157)",
    "--color-accent": "oklch(82% 0.111 230.318)",
    "--color-accent-content": "oklch(29% 0.066 243.157)",
    "--color-neutral": "oklch(44% 0.017 285.786)",
    "--color-neutral-content": "oklch(98% 0 0)",
    "--color-info": "oklch(60% 0.126 221.723)",
    "--color-info-content": "oklch(98% 0.019 200.873)",
    "--color-success": "oklch(59% 0.145 163.225)",
    "--color-success-content": "oklch(97% 0.021 166.113)",
    "--color-warning": "oklch(64% 0.222 41.116)",
    "--color-warning-content": "oklch(98% 0.016 73.684)",
    "--color-error": "oklch(58% 0.253 17.585)",
    "--color-error-content": "oklch(96% 0.015 12.422)",
    "--radius-selector": "0.25rem",
    "--radius-field": "1rem",
    "--radius-box": "0.25rem",
    "--size-selector": "0.25rem",
    "--size-field": "0.25rem",
    "--border": "1px",
    "--depth": "1",
    "--noise": "0",
  },
};

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      "light",
      customDarkTheme.mydark, 
    ],
  },
};
