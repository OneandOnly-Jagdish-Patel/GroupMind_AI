import { useState, useRef, useCallback } from "react";

export const useLiveTranscription = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // mic access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;
      setTranscription("");
      setError(null);

      // audio context
      const ctx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // connect to OpenAI realtime proxy
      const ws = new WebSocket("ws://localhost:8001");
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        setIsRecording(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          // OpenAI realtime events for text
          if (msg.type === "response.output_text.delta") {
            setTranscription((prev) => prev + msg.text);
          }

          if (msg.type === "response.output_text.done") {
            setTranscription((prev) => prev + " ");
          }

          // When speech is fully captured
          if (msg.type === "input_audio_buffer.speech_captured") {
            if (msg.transcript) {
              setTranscription((prev) => prev + msg.transcript + " ");
            }
          }

          if (msg.error) setError(msg.error);
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      ws.onclose = () => setIsRecording(false);

      // audio loop
      processor.onaudioprocess = (event) => {
        const socket = wsRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;

        const input = event.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(input.length);

        let sum = 0;
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          pcm[i] = s * 32767;
          sum += s * s;
        }

        // RMS for waveform
        setLevel(Math.sqrt(sum / input.length));

        socket.send(pcm.buffer);
      };

      source.connect(processor);
      processor.connect(ctx.destination);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const stopRecording = useCallback(() => {
    processorRef.current?.disconnect();
    audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    wsRef.current?.close();

    setIsRecording(false);
    setLevel(0);
  }, []);

  const clearTranscription = useCallback(() => {
    setTranscription("");
  }, []);

  return {
    isRecording,
    transcription,
    error,
    level,
    startRecording,
    stopRecording,
    clearTranscription,
  };
};
