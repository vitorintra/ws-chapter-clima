import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import OkxWebSocketClient from "../websocket/OkxWebSocketClient";

interface IWebSocketContext {
  isSocketOpened: boolean;
  okxSocket: OkxWebSocketClient;
}

interface Props {
  children: ReactNode;
}

const SocketContext = createContext({} as IWebSocketContext);

export const SocketContextProvider = ({ children }: Props) => {
  const okxSocket = useMemo(() => new OkxWebSocketClient(), []);

  useEffect(() => {
    okxSocket.init();

    function onOnline() {
      okxSocket.close();
      okxSocket.init();
    }

    function onOffline() {
      okxSocket.close();
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return function cleanup() {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [okxSocket]);

  const data = useMemo(
    () => ({
      isSocketOpened: okxSocket.isSocketOpened,
      okxSocket,
    }),
    [okxSocket]
  );

  return (
    <SocketContext.Provider value={data}>{children}</SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
