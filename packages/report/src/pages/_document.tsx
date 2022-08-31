import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
	return (
		<Html lang="en" data-color-mode="dark" data-dark-theme="dark">
			<Head>
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/Primer/20.4.1/base.min.css"
					integrity="sha512-Y3BvSXIyScMEFBi2QYvDc12tw0MpND6sYYKqdObiNlE432O1fv0/jeCbuuVeSNjd2ZuAM3EJbeVBFe/b0rKoYg=="
					crossOrigin="anonymous"
					referrerPolicy="no-referrer"
				/>
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/Primer/20.4.1/color-modes.min.css"
					integrity="sha512-XTbUut8Rc/r06Iif/K7xDOub5F4TO2vTCV4InexCz5RvpGMaSfUf2tMRxYX6ha0zzFy+UfKdb94ehR+dOKYPhg=="
					crossOrigin="anonymous"
					referrerPolicy="no-referrer"
				/>
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/Primer/20.4.1/utilities.min.css"
					integrity="sha512-OS48DOZqdQdDDxUfXtTx/xv8SjfIwc/k8gf75MaFh6uNb7xA50neIEvAi68wzvGJrW646ZVZH0AQXHSsvwMvpw=="
					crossOrigin="anonymous"
					referrerPolicy="no-referrer"
				/>
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/Primer/20.4.1/markdown.min.css"
					integrity="sha512-z9fESt0h0bJJwWXYjGCV8v/SLbIkxgEIRBvt9d4xw+xSNUT+D1RpA/BUu8FBu6RqRWetBNaKeCC9Tr16/hPBhw=="
					crossOrigin="anonymous"
					referrerPolicy="no-referrer"
				/>
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/styles/github-dark.min.css"
					integrity="sha512-rO+olRTkcf304DQBxSWxln8JXCzTHlKnIdnMUwYvQa9/Jd4cQaNkItIUj6Z4nvW1dqK0SKXLbn9h4KwZTNtAyw=="
					crossOrigin="anonymous"
					referrerPolicy="no-referrer"
				/>
			</Head>
			<body>
				<script
					dangerouslySetInnerHTML={{
						__html: `(() => {
							const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
							const persistedColorPreference = localStorage.getItem('theme') || 'auto';
							if (persistedColorPreference === 'dark' || (prefersDarkMode && persistedColorPreference !== 'light')) {
								document.documentElement.classList.toggle('dark', true);
							}
						})();`,
					}}
				/>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
