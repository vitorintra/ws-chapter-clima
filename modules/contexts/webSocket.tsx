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
  okxSocket: OkxWebSocketClient;
  isSocketOpened: boolean;
}

interface Props {
  children: ReactNode;
}

const SocketContext = createContext({} as IWebSocketContext);

export const SocketContextProvider = ({ children }: Props) => {
  const [isSocketOpened, setIsSocketOpened] = useState(false);

  const okxSocket = useMemo(() => new OkxWebSocketClient(setIsSocketOpened), []);

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
      isSocketOpened,
      okxSocket,
    }),
    [okxSocket, isSocketOpened]
  );

  return (
    <SocketContext.Provider value={data}>{children}</SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
