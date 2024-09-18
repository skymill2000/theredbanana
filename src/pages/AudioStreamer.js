import React, { useState, useEffect } from "react";

function AudioStreamer() {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    ws.binaryType = "arraybuffer"; // 바이너리 데이터 수신을 위해 설정
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket 연결 성공");
    };

    ws.onerror = (error) => {
      console.error("WebSocket 에러:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket 연결 종료");
    };

    // 컴포넌트 언마운트 시 소켓 닫기
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    if (socket) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const recorder = new MediaRecorder(stream);

          recorder.ondataavailable = (event) => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(event.data);
            }
          };

          setMediaRecorder(recorder);
        })
        .catch((error) => {
          console.error("마이크 접근 권한이 필요합니다.", error);
        });
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        console.log("서버 응답 수신");

        // 받은 데이터를 Blob으로 변환
        const audioBlob = new Blob([event.data], { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);

        // 오디오 재생
        const audio = new Audio(audioUrl);
        audio.play();
      };
    }
  }, [socket]);

  const startStreaming = () => {
    if (mediaRecorder && mediaRecorder.state === "inactive") {
      mediaRecorder.start(100); // 100ms마다 데이터 전송
      console.log("스트리밍 시작");
    }
  };

  const stopStreaming = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      console.log("스트리밍 종료");
    }
  };

  return (
    <div>
      <button onClick={startStreaming}>스트리밍 시작</button>
      <button onClick={stopStreaming}>스트리밍 종료</button>
    </div>
  );
}

export default AudioStreamer;
