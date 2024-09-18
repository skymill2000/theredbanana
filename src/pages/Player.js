const Player = function () {
  this.audioContext = null;
  this.buffers = [];
  this.source = null;
  this.playing = false;

  this.init = function () {
    const audioContextClass =
      window.AudioContext ||
      window.webkitAudioContext ||
      window.mozAudioContext ||
      window.oAudioContext ||
      window.msAudioContext;
    if (audioContextClass) {
      return (this.audioContext = new audioContextClass());
    } else {
      return toastError("오디오 권한 설정을 확인해주세요.");
    }
  };

  this.addBuffer = function (buffer) {
    this.buffers.push(buffer);
  };

  this.connect = function (inputText, url, onComplete = (f) => f) {
    const self = this;
    const path = `ws://112.220.79.221:${url}/ws`;
    let socket = new WsService({
      path: path,
      onOpen: function (event) {
        console.log(`[OPEN] ws://112.220.79.221:${url}/ws`);
        socket.ws.send(inputText);
        console.log(`[SEND] ${inputText}`);
      },
      onMessage: function (event) {
        console.log("[MESSAGE]");
        console.log(event.data);
        if (event.data.byteLength <= 55) return;
        self.addBuffer(new Int16Array(event.data));
        self.play();
      },
      onClose: function (event) {
        console.log("[CLOSE]");
        socket.ws = null;
        onComplete();
      },
    });
  };

  const wait = function () {
    this.playing = false;
    this.play(); // 다음 chunk 오디오 데이터 재생
  };

  this.play = function () {
    if (this.buffers.length > 0) {
      if (this.playing) return;
      this.playing = true;
      let pcmData = this.buffers.shift();
      const channels = 1;
      const frameCount = pcmData.length;
      const myAudioBuffer = this.audioContext.createBuffer(
        channels,
        frameCount,
        22050
      );
      // 화이트 노이즈로 버퍼를 채운다.
      for (let i = 0; i < channels; i++) {
        const nowBuffering = myAudioBuffer.getChannelData(i, 16, 22050);
        for (let j = 0; j < frameCount; j++)
          nowBuffering[j] = (((pcmData[j] + 32768) % 65536) - 32768) / 32768.0;
      }
      pcmData = null;
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = myAudioBuffer;
      this.source.connect(this.audioContext.destination);
      this.source.start();
      this.source.addEventListener("ended", wait.bind(this)); // 오디오 종료 시 이벤트
    }
  };
};
