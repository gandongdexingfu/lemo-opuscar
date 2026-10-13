import numpy as np, scipy.signal as ss
from scipy.io import wavfile
SR=48000; L=22.0; N=int(SR*L); BEAT=0.5
rng=np.random.default_rng(7)
D1=1/30  # sound lands one frame after picture

def t_(d): return np.arange(int(SR*d))/SR
def env(d,a=0.005,dec=None,curve=6):
    t=t_(d); e=np.minimum(1,t/max(a,1e-4))
    if dec is None: dec=d
    return e*np.exp(-curve*t/dec)
def bp(x,lo,hi,o=2): b,a=ss.butter(o,[lo/(SR/2),hi/(SR/2)],'band'); return ss.lfilter(b,a,x)
def lp(x,f,o=2): b,a=ss.butter(o,f/(SR/2),'low'); return ss.lfilter(b,a,x)
def hp(x,f,o=2): b,a=ss.butter(o,f/(SR/2),'high'); return ss.lfilter(b,a,x)
def nf(n): return 440*2**((n-69)/12)
NOTE={'D4':62,'E4':64,'F#4':66,'A4':69,'B4':71,'D5':74,'E5':76,'F#5':78,'A5':81,'B5':83,'D6':86,'G3':55,'A3':57,'B3':59,'D3':50,'F#3':54,'D2':38,'G2':43,'A2':45,'B2':47}
def hz(n): return nf(NOTE[n]) if isinstance(n,str) else n

# ---------- instruments ----------
def ks(f,d=1.2,bright=0.5):          # Karplus-Strong pluck (guzheng-ish)
    n=int(SR*d); p=int(SR/f); buf=rng.uniform(-1,1,p); y=np.zeros(n)
    for i in range(n):
        y[i]=buf[i%p]; buf[i%p]=0.996*(bright*buf[i%p]+(1-bright)*buf[(i+1)%p])
    return y*env(d,0.002,d,3)
def marimba(f,d=0.6):
    t=t_(d); return (np.sin(2*np.pi*f*t)+0.25*np.sin(2*np.pi*4*f*t)*np.exp(-30*t))*env(d,0.002,d,7)
def woodblock(acc=1):
    d=0.09; t=t_(d); x=np.sin(2*np.pi*(900+300*acc)*t)*np.exp(-60*t)+0.4*bp(rng.uniform(-1,1,len(t)),1500,4000)*np.exp(-90*t)
    return x
def shaker(): d=0.06; return hp(rng.uniform(-1,1,int(SR*d)),6000)*env(d,0.004,d,8)
def kick(): d=0.35; t=t_(d); f=45+80*np.exp(-25*t); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-9*t)
def clap():
    d=0.25; x=np.zeros(int(SR*d))
    for o in (0,0.012,0.024): s=int(o*SR); x[s:]+=bp(rng.uniform(-1,1,len(x)-s),900,3500)*np.exp(-30*t_(d-o))[:len(x)-s]
    return x*0.6
def bass(f,d=0.45):
    t=t_(d); x=np.sin(2*np.pi*f*t)+0.3*ss.sawtooth(2*np.pi*f*t); return lp(x,700)*env(d,0.005,d,4)
def pad(fs,d):
    t=t_(d); x=sum(ss.sawtooth(2*np.pi*f*(1+dt)*t) for f in fs for dt in (-0.004,0.004))
    e=np.minimum(1,t/0.3)*np.minimum(1,(d-t)/0.4); return lp(x,1200)*e/len(fs)
def chime(f,d=1.5):
    t=t_(d); return sum(a*np.sin(2*np.pi*f*r*t)*np.exp(-k*t) for r,a,k in ((1,1,3),(2.76,0.5,5),(5.4,0.25,8)))
# ---------- cartoon sfx ----------
def whoosh(d=0.45,up=True):
    t=t_(d); n=rng.uniform(-1,1,len(t)); out=np.zeros_like(n); seg=1024
    for i in range(0,len(n),seg):
        fr=i/len(n); c=400+3000*(fr if up else 1-fr)
        out[i:i+seg]=bp(n[i:i+seg+0],max(c*0.6,80),c*1.4)[:len(out[i:i+seg])]
    return out*np.sin(np.pi*t/d)**2
def splash(big=1.0):
    d=1.1; t=t_(d); n=rng.uniform(-1,1,len(t))
    body=lp(n,2500)*np.exp(-7*t)*1.2+hp(n,3000)*np.exp(-12*t)*0.5
    thump=np.sin(2*np.pi*(90+60*np.exp(-20*t))*t)*np.exp(-14*t)
    x=body+thump*big
    for _ in range(int(10*big)):   # bubbles
        s=rng.uniform(0.05,0.8); f0=rng.uniform(500,1400); dd=0.05
        tt=t_(dd); b=np.sin(2*np.pi*np.cumsum(f0*(1+3*tt/dd))/SR)*np.exp(-50*tt)
        i=int(s*SR); x[i:i+len(b)]+=0.25*b[:len(x)-i]
    return x
def plop(f=400):
    d=0.12; t=t_(d); fr=f*(1+2.2*t/d); return np.sin(2*np.pi*np.cumsum(fr)/SR)*env(d,0.002,d,6)
def pop(): d=0.05; t=t_(d); return np.sin(2*np.pi*np.cumsum(1200+2500*t/d)/SR)*np.exp(-70*t)
def boing(f=180,d=0.6):
    t=t_(d); fr=f*(1+0.35*np.sin(2*np.pi*14*t)*np.exp(-4*t))+f*0.6*np.exp(-12*t)
    return (np.sin(2*np.pi*np.cumsum(fr)/SR)+0.3*np.sin(2*np.pi*np.cumsum(2*fr)/SR))*env(d,0.003,d,4)
def slide(f0,f1,d=0.4):
    t=t_(d); fr=f0*(f1/f0)**(t/d); return np.sin(2*np.pi*np.cumsum(fr)/SR)*np.sin(np.pi*t/d)**0.5
def hiss(d):
    t=t_(d); return hp(rng.uniform(-1,1,len(t)),2500)*(t/d)**1.5
def puff(d=0.35): t=t_(d); return bp(rng.uniform(-1,1,len(t)),300,1800)*np.sin(np.pi*t/d)**2

# ---------- buses ----------
music=np.zeros((int(SR*2*L),)); sfx=np.zeros(N); beds=np.zeros((N,2))
def put(bus,x,t,g=1.0,wrap_len=None):
    i=int(round(t*SR)); n=len(bus)
    end=i+len(x)
    if end<=n: bus[i:end]+=g*x
    else:
        bus[i:n]+=g*x[:n-i]; bus[0:end-n]+=g*x[n-i:]   # wrap tail to start (loop)

# ---------- music: render 2 loops, keep the second ----------
CH=['D','Bm','G','A','D','Bm','G','A','D','G','A']
CHN={'D':['D3','F#3','A3'],'Bm':['B2','D3','F#3'],'G':['G2','B2','D3'],'A':['A2','E4','A3']}
ROOT={'D':'D2','Bm':'B2','G':'G2','A':'A2'}
MEL=['D5','F#5','A5','B5','A5','F#5','E5','D5','E5','F#5','A5','D6','B5','A5','F#5','A5']
for lp_ in (0,1):
    o=lp_*L
    for bar in range(11):
        t0=o+bar*2.0; ch=CH[bar]; full = 8<=bar<=9
        if bar<10 or True:
            for b in range(4):
                tb=t0+b*BEAT
                if bar<8:                       # part A: light pulse
                    put(music,woodblock(1 if b==0 else 0),tb,0.35 if b==0 else 0.22)
                    if bar>0:
                        for e in (0,0.25): put(music,shaker(),tb+e,0.10)
                elif bar<=9:                    # part B: full
                    put(music,kick(),tb,0.9)
                    if b in (1,3): put(music,clap(),tb,0.45)
                    for e in (0.25,): put(music,shaker(),tb+e,0.14)
                    put(music,bass(hz(ROOT[ch])*2,0.22),tb,0.5); put(music,bass(hz(ROOT[ch])*2,0.22),tb+0.25,0.3)
        if bar<8 and bar>0:
            put(music,bass(hz(ROOT[ch])*2,0.4),t0,0.35); put(music,bass(hz(ROOT[ch])*2,0.3),t0+1.0,0.22)
            if bar%2==1:   # sparse guzheng pickups
                for k,n in enumerate(['A4','B4','D5']): put(music,ks(hz(n),0.9),t0+1.25+k*0.25,0.22)
        if full:
            put(music,pad([hz(n)*2 for n in CHN[ch]],2.0),t0,0.18)
            for k in range(8): put(music,ks(hz(MEL[(bar-8)*8+k]),0.6,0.55),t0+k*0.25,0.33)
        if bar==10:   # finale bar: melody resolves, then decay into loop
            put(music,pad([hz(n)*2 for n in CHN['D']],2.0),t0,0.16)
            for k,n in enumerate(['D6','B5','A5','F#5']): put(music,ks(hz(n),0.8,0.55),t0+k*0.25,0.3)
            put(music,ks(hz('D5'),1.8,0.5),t0+1.0,0.3)
            put(music,kick(),t0,0.8); put(music,clap(),t0+0.5,0.35)
music=music[int(SR*L):int(SR*2*L)]

# ---------- sfx timeline (seconds on the 22 s picture) ----------
def load(name,a=0,d=None):
    sr,x=wavfile.read(f"wav/{name}.wav"); x=x.astype(np.float32)/32768; x=x.mean(1)
    x=x[int(a*sr): int((a+d)*sr) if d else None]; return x
def fade(x,fi=0.05,fo=0.1):
    n=len(x); e=np.ones(n); a=int(fi*SR); b=int(fo*SR)
    if a: e[:a]=np.linspace(0,1,a)
    if b: e[-b:]=np.linspace(1,0,b)
    return x*e
def norm(x): return x/ (np.max(np.abs(x))+1e-9)

hum=norm(load('01_freezer_a_Fridge_Hum',2,4))
put(sfx,fade(hum[:int(3.0*SR)],0.01,0.5),21.3,0.08)     # wraps: 21.3 → 1.8 (fades out)
put(sfx,puff(),0.55+D1,0.22); put(sfx,puff(0.3),1.0+D1,0.12)
siz=norm(load('02_sizzle_c_Bacon_Sizzling',1,2.6)); put(sfx,fade(siz,0.01,0.8),2.0+D1,0.45)
boil=norm(load('03_boil_b_Pot_of_Water_Boiling',5,20)); put(sfx,fade(boil[:int(19.4*SR)],0.3,0.8),2.0,0.3)
for t in (4.3,4.8,5.13,5.6,5.85): put(sfx,pop(),t+D1,0.35)
put(sfx,boing(260,0.5),4.45+D1,0.25)
for t in (6.0,6.5,7.0,7.5): put(sfx,woodblock(1),t,0.0)   # (chant handled by music)
gulp=norm(load('06_gulp_a_gulping',0,0.7)); put(sfx,fade(gulp,0.005,0.15),6.72+D1,0.35)
put(sfx,whoosh(0.35,False),7.66,0.3)
put(sfx,splash(1.0),8.03+D1,0.7)
for t in (10.3,10.9,11.5):
    put(sfx,splash(0.4),t+D1,0.35); put(sfx,boing(170,0.45),t+0.18+D1,0.32)
put(sfx,slide(1400,500,0.45),12.55+D1,0.18); put(sfx,slide(500,1300,0.3),13.15+D1,0.15)
for t,n in zip((14.25,14.6,15.1,15.45,15.7),('A4','B4','D5','E5','F#5')):
    put(sfx,plop(380),t+D1,0.35); put(sfx,marimba(hz(n)),t+D1,0.3)
put(sfx,whoosh(0.4,True),16.0,0.3)
put(sfx,splash(1.2),16.42+D1,0.75)
drip=norm(load('05_drip_a_Coffee_Drips',3,1.2)); put(sfx,fade(drip,0.01,0.3),17.0,0.2)
put(sfx,chime(hz('A5')),18.3+D1,0.25); put(sfx,chime(hz('D6')),18.42+D1,0.2)
put(sfx,hiss(1.6),19.5,0.13)
for k in range(10): put(sfx,chime(rng.choice([hz('D6'),hz('F#5'),hz('A5'),2349.3,2637.0]),0.9),20.8+k*0.11,0.07)

# ---------- mix ----------
mix=0.55*music+sfx
st=np.stack([mix,mix],1)
st[:,0]+=0.002*rng.standard_normal(N)*0  # placeholder
peak=np.max(np.abs(st)); st=st/peak*0.7
wavfile.write("mix_raw.wav",SR,(st*32767).astype(np.int16))
print("done, raw peak",round(float(peak),3))
