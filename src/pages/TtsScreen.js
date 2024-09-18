import React, { useState, useEffect } from "react";
import { ReactMic } from "react-mic";

const TtsScreen = () => {
  const [record, setRecord] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // WebSocket 연결 설정
    const ws = new WebSocket("ws://localhost:8080");
    setSocket(ws);

    // 컴포넌트 언마운트 시 소켓 닫기
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const onStop = (recordedData) => {
    console.log("녹음 데이터:", recordedData);
  };

  return (
    <div>
      <ReactMic
        record={record}
        onStop={onStop}
        strokeColor="#000000"
        backgroundColor="#FF4081"
      />
      <button onClick={() => setRecord(true)}>녹음 시작</button>
      <button onClick={() => setRecord(false)}>녹음 종료</button>
    </div>
  );
};

export default TtsScreen;
