"""Chatterbox Multilingual behind the OpenAI speech API, for Bolna's Custom TTS.

Bolna sends POST {base_url}/audio/speech with model, voice, input,
response_format=mp3 and speed=1.0, a Bearer key, and waits up to 20 s for the
whole clip. Run it on a GPU (a free Colab T4 works) and expose it over https.

    TTS_API_KEY=some-secret uvicorn server:app --host 0.0.0.0 --port 8000
"""

import io
import os
import subprocess
import threading
from collections import OrderedDict
from pathlib import Path

import soundfile as sf
import torch
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

LANGUAGE = os.environ.get("TTS_LANGUAGE", "hi")
API_KEY = os.environ.get("TTS_API_KEY", "")
# A voice named "x" is cloned from voices/x.wav (5 to 10 s of clean speech).
# Any other name uses Chatterbox's built-in voice.
VOICES = Path(os.environ.get("TTS_VOICES", Path(__file__).parent / "voices"))

if torch.cuda.is_available():
    DEVICE = "cuda"
elif torch.backends.mps.is_available():
    DEVICE = "mps"
else:
    DEVICE = "cpu"

model = ChatterboxMultilingualTTS.from_pretrained(device=DEVICE)
# One GPU renders one clip at a time; parallel calls queue here.
render_lock = threading.Lock()
# Greetings and "Ek second..." repeat on every call, so keep recent clips.
cache: "OrderedDict[tuple[str, str], bytes]" = OrderedDict()
CACHE_SIZE = 256

app = FastAPI()


class Speech(BaseModel):
    model: str = "chatterbox-multilingual"
    voice: str = "default"
    input: str
    response_format: str = "mp3"
    speed: float = 1.0


def check(authorization: str | None):
    if API_KEY and authorization != f"Bearer {API_KEY}":
        raise HTTPException(status_code=401, detail="bad key")


def to_mp3(wav, sr: int) -> bytes:
    pcm = io.BytesIO()
    sf.write(pcm, wav.squeeze(0).cpu().numpy(), sr, format="WAV")
    out = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-f", "wav", "-i", "pipe:0", "-f", "mp3", "-b:a", "64k", "pipe:1"],
        input=pcm.getvalue(),
        capture_output=True,
        check=True,
    )
    return out.stdout


def render(text: str, voice: str) -> bytes:
    key = (voice, text)
    if key in cache:
        cache.move_to_end(key)
        return cache[key]
    prompt = VOICES / f"{voice}.wav"
    with render_lock:
        wav = model.generate(
            text,
            language_id=LANGUAGE,
            audio_prompt_path=str(prompt) if prompt.exists() else None,
        )
    clip = to_mp3(wav, model.sr)
    cache[key] = clip
    if len(cache) > CACHE_SIZE:
        cache.popitem(last=False)
    return clip


@app.post("/v1/audio/speech")
def speech(body: Speech, authorization: str | None = Header(default=None)):
    check(authorization)
    text = body.input.strip()
    if not text:
        raise HTTPException(status_code=400, detail="empty input")
    return Response(render(text, body.voice), media_type="audio/mpeg")


@app.get("/v1/models")
def models(authorization: str | None = Header(default=None)):
    check(authorization)
    return {"object": "list", "data": [{"id": "chatterbox-multilingual", "object": "model"}]}


@app.get("/health")
def health():
    return {"ok": True, "device": DEVICE, "language": LANGUAGE}
