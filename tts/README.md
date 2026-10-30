# Chatterbox voice for Bhaada

`server.py` serves [Chatterbox Multilingual](https://github.com/resemble-ai/chatterbox)
(MIT, open source) behind the OpenAI speech API, which is what Bolna's
**Custom TTS** speaks. It always renders Hindi (`TTS_LANGUAGE=hi`).

## Run it free on Colab (T4 GPU)

New notebook → Runtime → Change runtime type → T4 GPU, runtime version 2026.07
(the last image on Python 3.12). Then:

```python
!git clone https://github.com/lakshitasethia/Bolna_AI && cd Bolna_AI/tts && pip install -q -r requirements.txt
# Colab's torchvision needs a newer torch than Chatterbox pins, and breaks its imports
!pip uninstall -y -q torchvision
!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cf && chmod +x cf

import subprocess, os
os.chdir("Bolna_AI/tts")
subprocess.Popen("TTS_API_KEY=pick-a-secret uvicorn server:app --host 0.0.0.0 --port 8000 > tts.log 2>&1", shell=True)
subprocess.Popen("../../cf tunnel --url http://localhost:8000 > cf.log 2>&1", shell=True)
```

Wait about a minute for the model to load, then `!grep -o 'https://.*trycloudflare.com' cf.log`.

## Register it in Bolna

Settings → Integrations → TTS → Custom TTS → Add voice:

- Voice: `bhaada` (any name; drop a `voices/bhaada.wav` clip of 5–10 s to clone a voice)
- Model name: `chatterbox-multilingual`
- Endpoint URL: `https://<tunnel>.trycloudflare.com/v1`
- API key: the `TTS_API_KEY` you picked

Then set `BHAADA_TTS_VOICE=bhaada` in `web/.env.local` and run `node scripts/bolna-setup.mjs`.

## Things to know

- Bolna waits for the whole clip of each sentence, so the server's render time is the
  agent's pause. Keep it on a GPU; on a CPU or a Mac it is too slow for a live call.
- One GPU renders one clip at a time. Six parallel calls share it, so expect more lag
  than with a hosted voice. Common lines (greetings, "Ek second...") are cached.
- The Colab tunnel URL changes every run. Re-register the voice when it does.
