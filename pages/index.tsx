import { useEffect } from "react";
import { useSocketContext } from "../modules/contexts/webSocket";

export default function Home() {
  const { okxSocket, isSocketOpened } = useSocketContext();

  useEffect(() => {
    if (isSocketOpened) {
      okxSocket.subscribe({
        payload: {
          channel: "mark-price",
          instId: "BTC-USDT",
        },
        callback: (data) => {
          console.log(data);
        },
      });
    }

    return () => {
      if (isSocketOpened) {
        okxSocket.unsubscribe({
          payload: {
            channel: "mark-price",
            instId: "BTC-USDT",
          },
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSocketOpened]);

  return <></>;
}
