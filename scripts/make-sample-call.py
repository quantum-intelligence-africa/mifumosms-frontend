"""Generate the staged Kiswahili sample call used on the website (public/website/sample-call-sw.mp3).

Two Tanzanian neural voices (Microsoft edge-tts), shaped to sound like a real recorded call:
natural fillers in the script, per-line pace and pitch, varied pauses between turns, the caller
filtered like a phone line and the agent like a headset, light room tone and loudness levelling.

Needs: pip install edge-tts imageio-ffmpeg
Usage: python scripts/make-sample-call.py public/website/sample-call-sw.mp3 <temp_dir>
Prints {"duration", "starts"}: copy the starts into SAMPLE_LINES[].at and duration into
SAMPLE_CALL.durationSec (src/website/content.ts). Keep LINES in sync with SAMPLE_LINES[].sw.
"""
import asyncio
import json
import os
import subprocess
import sys
import wave

import edge_tts
import imageio_ffmpeg

AGENT = "sw-TZ-RehemaNeural"   # Neema, the booking agent
CUSTOMER = "sw-TZ-DaudiNeural"  # the passenger, calling from a mobile phone

# (speaker, text, rate, pitch, pause_after_seconds)
LINES = [
    ("agent", "Habari za asubuhi, Safari Bora Coaches, naitwa Neema. Nikusaidie vipi?", "-3%", "+2Hz", 0.45),
    ("customer", "Aah, nzuri dada. Eeh, nilikuwa nauliza... kesho asubuhi kuna basi la kwenda Arusha?", "+2%", "-2Hz", 0.40),
    ("agent", "Ndiyo, lipo. Tuna basi la saa kumi na mbili asubuhi, na lingine la saa tatu. Yote yanaondoka Kituo cha Mabasi cha Magufuli.", "-2%", "+0Hz", 0.60),
    ("customer", "Sawa sawa. Na nauli ni shilingi ngapi?", "+4%", "-1Hz", 0.35),
    ("agent", "Ni shilingi elfu arobaini na tano, kwa kiti kimoja.", "-4%", "+1Hz", 0.55),
    ("customer", "Mmh, sawa. Basi tunahitaji viti vitatu, kwenye lile la saa tatu. Naweza kulipia kwa simu?", "+1%", "-3Hz", 0.45),
    ("agent", "Ndiyo, bila shaka. Unaweza kulipa kwa M-Pesa, Mixx by Yas, au Airtel Money. Nitakutumia kiungo cha kuhifadhi viti kwa SMS, sawa?", "-1%", "+2Hz", 0.40),
    ("customer", "Sawa, asante sana. Nitumie kwenye namba hii hii.", "+3%", "-2Hz", 0.40),
    ("agent", "Sawa, nakutumia sasa hivi. Asante kwa kupiga, safari njema!", "-2%", "+3Hz", 0.0),
]

RATE = 24000
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

# Caller: narrow phone band with a touch of compression. Agent: clearer headset band.
FILTERS = {
    "customer": "highpass=f=280,lowpass=f=3500,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,volume=1.05",
    "agent": "highpass=f=110,lowpass=f=7200,acompressor=threshold=-22dB:ratio=2:attack=8:release=120",
}


def run(*args: str) -> None:
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", *args], check=True)


async def synth(text: str, voice: str, rate: str, pitch: str, path: str) -> None:
    await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(path)


async def main(out_mp3: str, work: str) -> None:
    os.makedirs(work, exist_ok=True)
    pcm = bytearray()
    starts = []
    pcm += b"\x00\x00" * int(0.35 * RATE)  # short lead-in, like a recording that starts as the call connects
    for i, (who, text, rate, pitch, pause) in enumerate(LINES):
        mp3 = os.path.join(work, f"line{i}.mp3")
        wav = os.path.join(work, f"line{i}.wav")
        await synth(text, AGENT if who == "agent" else CUSTOMER, rate, pitch, mp3)
        run("-i", mp3, "-af", FILTERS[who], "-ac", "1", "-ar", str(RATE), "-sample_fmt", "s16", wav)
        starts.append(round(len(pcm) / 2 / RATE, 2))
        with wave.open(wav) as w:
            pcm += w.readframes(w.getnframes())
        pcm += b"\x00\x00" * int(pause * RATE)
    pcm += b"\x00\x00" * int(0.5 * RATE)

    dry = os.path.join(work, "dry.wav")
    with wave.open(dry, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(bytes(pcm))

    # Faint room tone under the whole call, then level loudness for web playback.
    run(
        "-i", dry,
        "-f", "lavfi", "-i", f"anoisesrc=color=brown:amplitude=0.012:sample_rate={RATE}",
        "-filter_complex",
        "[1:a]lowpass=f=1200,volume=0.35[room];[0:a][room]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-17:TP=-1.5:LRA=9",
        "-ar", str(RATE), "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "80k", out_mp3,
    )
    print(json.dumps({"duration": round(len(pcm) / 2 / RATE, 2), "starts": starts}))


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], sys.argv[2]))
