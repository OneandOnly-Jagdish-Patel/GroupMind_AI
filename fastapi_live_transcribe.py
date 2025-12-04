import asyncio
import numpy as np
import httpx
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from asr import asr

app = FastAPI(
    title="Live Transcription API",
    description="WebSocket API for real-time audio transcription",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],  # Add your React app URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Grok AI configuration
GROK_API_KEY = os.getenv("GROK_API_KEY", "your-grok-api-key-here")
GROK_API_URL = "https://api.x.ai/v1/chat/completions"

async def score_debate_text(text: str) -> dict:
    """Score debate performance using Grok AI."""
    try:
        prompt = f"""
        Analyze this debate segment and provide scoring on a scale of 1-10 for each category:
        
        Text: "{text}"
        
        Please evaluate:
        1. Clarity (how clear and understandable the argument is)
        2. Logic (logical flow and reasoning)
        3. Evidence (use of facts, examples, or support)
        4. Persuasiveness (convincing power)
        5. Delivery (speaking style and confidence)
        
        Respond in JSON format:
        {{
            "clarity": score,
            "logic": score,
            "evidence": score,
            "persuasiveness": score,
            "delivery": score,
            "overall_score": average,
            "feedback": "brief constructive feedback"
        }}
        """
        
        headers = {
            "Authorization": f"Bearer {GROK_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messages": [
                {"role": "system", "content": "You are an expert debate judge. Analyze debate performance objectively and provide constructive feedback."},
                {"role": "user", "content": prompt}
            ],
            "model": "grok-beta",
            "temperature": 0.3
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(GROK_API_URL, headers=headers, json=payload, timeout=30.0)
            
            if response.status_code == 200:
                result = response.json()
                grok_response = result["choices"][0]["message"]["content"]
                
                import json
                try:
                    start = grok_response.find('{')
                    end = grok_response.rfind('}') + 1
                    if start >= 0 and end > start:
                        json_str = grok_response[start:end]
                        return json.loads(json_str)
                except:
                    pass
                
                return {
                    "clarity": 7,
                    "logic": 7,
                    "evidence": 6,
                    "persuasiveness": 7,
                    "delivery": 7,
                    "overall_score": 6.8,
                    "feedback": "Analysis in progress - please check your Grok API configuration"
                }
            else:
                return {
                    "error": f"Grok API error: {response.status_code}",
                    "message": "Please check your API key and try again"
                }
                
    except Exception as e:
        return {
            "error": f"Scoring error: {str(e)}",
            "message": "Unable to score at this time"
        }


@app.websocket('/ws/transcript')
async def transcript_only_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for transcript-only (no AI scoring).
    
    Expects: Binary audio data (Int16Array buffer from browser)
    Returns: JSON messages with transcription results only
    
    Message format:
    - {"info": "status message"}
    - {"text": "transcribed text"}  
    - {"error": "error message"}
    """
    await websocket.accept()
    await websocket.send_json({"info": "Connected to transcript-only endpoint."})
    
    sample_buffer = []
    samples_per_window = 16000 * 3  
    
    try:
        while True:
            data = await websocket.receive_bytes()
            
            audio_chunk = np.frombuffer(data, dtype=np.int16)
            sample_buffer.extend(audio_chunk)
            
            if len(sample_buffer) >= samples_per_window:
                window_samples = np.array(sample_buffer[:samples_per_window], dtype=np.float32)
                sample_buffer = sample_buffer[samples_per_window:]
                
                audio_normalized = window_samples / 32767.0
                
                def transcribe_audio(audio_data):
                    try:
                        text = asr.transcribe(audio_data)
                        return text.strip() if text else ""
                    except Exception as e:
                        return f"[transcription error: {e}]"
                
                text = await asyncio.get_event_loop().run_in_executor(
                    None, transcribe_audio, audio_normalized
                )
                
                if text:
                    await websocket.send_json({"text": text})
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"error": f"Server error: {str(e)}"})


@app.websocket('/ws/debate')
async def debate_scoring_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for live transcription with AI debate scoring.
    
    Expects: Binary audio data (Int16Array buffer from browser)
    Returns: JSON messages with transcription AND Grok AI scoring
    
    Message format:
    - {"info": "status message"}
    - {"text": "transcribed text", "scores": {...}, "feedback": "..."}  
    - {"error": "error message"}
    """
    await websocket.accept()
    await websocket.send_json({"info": "Connected to debate scoring endpoint. Transcription + AI analysis active."})
    
    sample_buffer = []
    samples_per_window = 16000 * 3  
    
    try:
        while True:
            data = await websocket.receive_bytes()
            
            audio_chunk = np.frombuffer(data, dtype=np.int16)
            sample_buffer.extend(audio_chunk)
            
            if len(sample_buffer) >= samples_per_window:
                window_samples = np.array(sample_buffer[:samples_per_window], dtype=np.float32)
                sample_buffer = sample_buffer[samples_per_window:]
                
                audio_normalized = window_samples / 32767.0
                
                def transcribe_audio(audio_data):
                    try:
                        text = asr.transcribe(audio_data)
                        return text.strip() if text else ""
                    except Exception as e:
                        return f"[transcription error: {e}]"
                
                text = await asyncio.get_event_loop().run_in_executor(
                    None, transcribe_audio, audio_normalized
                )
                
                if text:
                    scores = await score_debate_text(text)
                    
                    response = {
                        "text": text,
                        "scores": scores,
                        "timestamp": asyncio.get_event_loop().time()
                    }
                    
                    await websocket.send_json(response)
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"error": f"Server error: {str(e)}"})


@app.websocket('/ws')
async def legacy_endpoint(websocket: WebSocket):
    """Legacy endpoint - redirects to transcript-only for backward compatibility."""
    await websocket.accept()
    await websocket.send_json({
        "info": "This endpoint is deprecated. Use /ws/transcript for text-only or /ws/debate for AI scoring.",
        "redirect": "Please update your frontend to use /ws/transcript or /ws/debate"
    })
    await websocket.close()


@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers."""
    return {"status": "healthy", "service": "live-transcription-api"}


@app.get("/")
async def root():
    """API information endpoint."""
    return {
        "message": "Live Transcription & Debate Scoring API",
        "endpoints": {
            "transcript_only": "ws://host/ws/transcript",
            "debate_scoring": "ws://host/ws/debate", 
            "legacy": "ws://host/ws (deprecated)"
        },
        "health_check": "/health",
        "docs": "/docs",
        "grok_ai_enabled": bool(GROK_API_KEY and GROK_API_KEY != "your-grok-api-key-here")
    }
