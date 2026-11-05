"""Render game gunshots from CC0 sources; ffmpeg required. No commercial-game audio.
Usage: python3 scripts/prepare_doctrine_audio.py /path/to/source-directory
The directory contains six class WAVs named handgun.wav, assault_rifle.wav, etc.
"""
import sys, json, hashlib, subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]);manifest=root/'assets/audio/recordings.json'
rows=json.loads(manifest.read_text())
# Use the exact approved artillery report as the recorded low/mid-frequency body.
body=root/'assets/audio/effects/artillery.mp3'
calibers={'handgun':(.68,1.35,.37),'assault_rifle':(.52,1.2,.32),'machine_pistol':(.40,1.5,.24),'magnum':(.88,.95,.56),'shotgun':(.98,1.05,.62),'sniper':(1.05,.82,.65)}
for item in rows:
 key=Path(item['file']).stem.rsplit('-',1)[0];duration,pitch,amount=calibers[key]
 original=source/(key+'.wav')
 assert hashlib.sha256(original.read_bytes()).hexdigest()==item['sourceSha256'],key
 # Preserve a bright recorded crack, add the artillery's meat, and render a short room reflection.
 filters=(f'[0:a]aformat=sample_rates=44100:channel_layouts=mono,highpass=f=65,volume=0.95[dry];'
 f'[1:a]aformat=sample_rates=44100:channel_layouts=mono,asetrate={44100*pitch},aresample=44100,highpass=f=60,lowpass=f=1800,atrim=duration={duration-.08},afade=t=out:st=0.12:d={duration-.2},volume={amount}[body];'
 f'[dry][body]amix=inputs=2:normalize=0,bass=g=3:f=150,lowpass=f=12500,aecho=0.9:0.85:43|79:0.13|0.07,'
 f'acompressor=threshold=0.4:ratio=1.5:attack=20:release=80,alimiter=limit=0.94:attack=1:release=40:level=false,afade=t=out:st={duration-.12}:d=0.12')
 subprocess.run(['ffmpeg','-y','-v','error','-ss',str(item['offsetSeconds']),'-i',str(original),'-i',str(body),'-filter_complex',filters,'-t',str(duration),'-ac','1','-ar','44100','-codec:a','libmp3lame','-b:a','160k','-map_metadata','-1',str(root/item['file'])],check=True)
 item['durationSeconds']=duration;item['sha256']=hashlib.sha256((root/item['file']).read_bytes()).hexdigest()
 item['bodySource']='assets/audio/effects/artillery.mp3';item['bodySourceSha256']=hashlib.sha256(body.read_bytes()).hexdigest()
 item['edit']='Recorded full-band firearm crack + caliber-scaled approved artillery body (60–1800Hz), short 43/79ms reflections, gentle compression, peak limiter'
manifest.write_text(json.dumps(rows,indent=2)+'\n')
print('Rendered 14 layered firearm reports; artillery and other power samples preserved.')
