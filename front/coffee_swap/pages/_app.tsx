import type { AppProps } from "next/app";
import Web3Modal from "web3modal";
import { useEffect } from "react";

declare global {
  interface Window {
    web3Modal: {
      provider: unknown;
    };
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    window.web3Modal = {
      provider: new Web3Modal({
        cacheProvider: false,
        providerOptions: {},
      }),
    };
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
