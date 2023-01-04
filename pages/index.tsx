import { useEffect, useRef, useState } from "react";
import { useSocketContext } from "../modules/contexts/webSocket";

export default function Home() {
  const { okxSocket, isSocketOpened } = useSocketContext();
  const [mark, setMark] = useState("BTC");
  const [markPrice, setMarkPrice] = useState({
    instId: "--",
    markPrice: "--",
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSocketOpened) {
      okxSocket.subscribe({
        payload: {
          channel: "mark-price",
          instId: `${mark}-USDT`,
        },
        callback: (data) => {
          const parsedData = JSON.parse(data);

          console.log(parsedData);

          setMarkPrice({
            instId: parsedData?.data[0].instId,
            markPrice: parsedData?.data[0].markPx,
          });
        },
      });
    }

    return () => {
      if (isSocketOpened) {
        okxSocket.unsubscribe({
          payload: {
            channel: "mark-price",
            instId: `${mark}-USDT`,
          },
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSocketOpened, mark]);

  const handleOnClick = () => {
    if (inputRef.current) {
      setMark(inputRef.current.value);
    }
  }

  return (
    <>
      <h1>Mark Price</h1>
      <h4>instId: {markPrice.instId}</h4>
      <h4>price: {markPrice.markPrice}</h4>
      <input type="text" placeholder="digite a cripto que deseja" ref={inputRef} />
      <button onClick={handleOnClick}>se inscrever no canal</button>
    </>
  );
}
