from transformers import pipeline
import threading


class ASR:
    """Simple ASR wrapper that loads a pipeline once and exposes a transcribe() method.

    Notes:
    - Loading a model can take time and memory. Choose a smaller model for faster startup.
    - This loads at ASR() construction; create a single instance and reuse it.
    """

    def __init__(self, model_name: str = "openai/whisper-base"):
        self.model_name = model_name
        self._lock = threading.Lock()
        print(f"Loading ASR model '{model_name}'... (this may take a while)")
        self.pipe = pipeline("automatic-speech-recognition", model=model_name)
        print("ASR model loaded")

    def transcribe(self, audio_numpy):
        """Transcribe a numpy float32 array (mono, 16 kHz normalized to [-1,1]).

        Returns a string with the transcription or raises on failure.
        """
        with self._lock:
            res = self.pipe(audio_numpy)
        # pipeline usually returns a dict with a 'text' key
        if isinstance(res, dict):
            return res.get("text", "")
        return str(res)

asr = ASR()
