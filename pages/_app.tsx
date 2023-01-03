import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SocketContextProvider } from "../modules/contexts/webSocket";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>WebSockets no React</title>
      </Head>
      <SocketContextProvider>
        <Component {...pageProps} />
      </SocketContextProvider>
    </>
  );
}
