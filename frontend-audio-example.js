// React Component Example: Browser Audio Capture for Debate AI
// This shows how to capture microphone audio and send it to your Socket.IO backend

import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const DebateAudioCapture = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [debateScore, setDebateScore] = useState(null);
  const [socket, setSocket] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Connect to your Node.js Socket.IO server
    const socketConnection = io('http://localhost:5001');
    setSocket(socketConnection);

    // Listen for transcription results from backend
    socketConnection.on('transcription_result', (data) => {
      console.log('Received transcription:', data);
      setTranscript(data.transcript);
      if (data.score) {
        setDebateScore(data.score);
      }
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,      // Match FastAPI expected sample rate
          channelCount: 1,        // Mono audio
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      streamRef.current = stream;

      // Create AudioContext for processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // Create ScriptProcessorNode to capture raw audio data
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (isRecording && socket) {
          const inputBuffer = event.inputBuffer;
          const inputData = inputBuffer.getChannelData(0); // Get mono channel

          // Convert Float32Array to Int16Array (required format)
          const int16Array = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            // Convert from [-1, 1] to [-32768, 32767]
            int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32767));
          }

          // Send audio data to Node.js backend via Socket.IO
          socket.emit('send_audio_data', {
            audio_data: Array.from(int16Array), // Convert to regular array for JSON
            sample_rate: 16000
          });
        }
      };

      // Connect audio processing chain
      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);

      // Tell backend to start speech-to-text session
      socket.emit('start_speech_to_text', {
        endpoint_type: 'debate' // or 'transcript' for simple transcription
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Microphone permission denied or not available');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    // Stop audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Tell backend to stop speech-to-text session
    if (socket) {
      socket.emit('stop_speech_to_text');
    }
  };

  return (
    <div className="debate-audio-capture">
      <h2>Debate AI - Live Transcription</h2>
      
      <div className="controls">
        {!isRecording ? (
          <button onClick={startRecording} className="start-btn">
            Start Speaking
          </button>
        ) : (
          <button onClick={stopRecording} className="stop-btn">
            Stop Speaking
          </button>
        )}
      </div>

      <div className="status">
        Status: {isRecording ? '🎤 Recording...' : '⏸️ Stopped'}
      </div>

      <div className="transcript-display">
        <h3>Live Transcript:</h3>
        <p>{transcript || 'No speech detected yet...'}</p>
      </div>

      {debateScore && (
        <div className="debate-score">
          <h3>AI Debate Analysis:</h3>
          <div className="score-details">
            <p><strong>Overall Score:</strong> {debateScore.overall_score}/10</p>
            <p><strong>Clarity:</strong> {debateScore.clarity_score}/10</p>
            <p><strong>Logic:</strong> {debateScore.logic_score}/10</p>
            <p><strong>Evidence:</strong> {debateScore.evidence_score}/10</p>
            <p><strong>Feedback:</strong> {debateScore.feedback}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateAudioCapture;