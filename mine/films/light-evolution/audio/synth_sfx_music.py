import numpy as np, wave, json
from scipy.signal import lfilter, fftconvolve, butter
ev=json.load(open('fevents.json')); TT=ev['T']; ERAS=ev['eras']; P=ev['P']; IG=ev['IG']; OFF=ev['OFF']; EGG=ev['EGG']
SR=44100; T=TT['END']; N=int(SR*T); t=np.arange(N)/SR; rng=np.random.default_rng(11)
L=np.zeros(N); R=np.zeros(N)
def lp(x,a): return lfilter([a],[1,-(1-a)],x)
def bp(x,lo,hi): b,a=butter(2,[lo/(SR/2),hi/(SR/2)],'band'); return lfilter(b,a,x)
def add(s,t0,g=1,pan=0):
    i=int(t0*SR); n=min(len(s),N-i)
    if n<=0 or i<0: return
    L[i:i+n]+=s[:n]*g*(1-pan); R[i:i+n]+=s[:n]*g*(1+pan)
def noise(d): return rng.standard_normal(int(d*SR))
def env(d,a=.01,r=.2): n=int(d*SR); x=np.arange(n)/SR; return np.minimum(1,x/a)*np.exp(-x/r)
def tone(f,d,dec,parts=((1,1),)): x=np.arange(int(d*SR))/SR; return sum(a*np.sin(2*np.pi*f*k*x) for k,a in parts)*np.exp(-x/dec)
def span(t0,t1,fi=.2,fo=.3): return np.clip((t-t0)/fi,0,1)*np.clip((t1-t)/fo,0,1)*((t>=t0)&(t<=t1))
def crackle(t0,t1,n,g):
    for k in range(n):
        tq=t0+rng.random()*(t1-t0); c=noise(.006)*np.exp(-np.arange(int(.006*SR))/SR/.0015); add(bp(c,1500,8000),tq,g*(.4+rng.random()),rng.uniform(-.6,.6))
def strike(t0,g=.4):
    s=bp(noise(.22),1500,6000)*np.linspace(.3,1,int(.22*SR))**1.5; add(s,t0-.22,g*.8,-.2)
    n=noise(1.0); x=np.arange(len(n))/SR; add(bp(n,800,9000)*np.exp(-x/.12)+lp(n,.03)*np.exp(-x/.35)*3,t0,g)
def puff(t0,g=.5): n=lp(noise(.45),.05); add(n*np.exp(-np.arange(len(n))/SR/.09),t0,g)
def click(t0,g=.4,f=2300): s=np.zeros(int(.12*SR)); s[:50]=rng.standard_normal(50); s+=tone(f,.12,.012)*.4; add(s,t0,g,.1)
def hiss_bed(t0,t1,g,a=.012):
    fl=lp(rng.standard_normal(N),a); m=span(t0,t1,.3,.4); L[:]+=fl*m*g; R[:]+=fl*m*g
def hum(t0,t1,g,f=120,h=5):
    m=span(t0,t1,.05,.08); s=sum(np.sin(2*np.pi*f*k*t)/k**1.3 for k in range(1,h+1)); L[:]+=s*m*g; R[:]+=s*m*g
# ---------- 片頭火柴 ----------
strike(.7); crackle(.85,2.2,9,.05); hiss_bed(.75,2.35,.10); puff(2.3,.35)
# ---------- 各代 ----------
scale=[440,523.3,587.3,659.3,784,880,1046.5,1174.7,1318.5,1568,1760,2093]
for i,e in enumerate(ERAS):
    s0=e['start']; ty=e['type']; ig=s0+IG; of=s0+OFF; last=(i==len(ERAS)-1)
    end_on = TT['OUT0']+2.0 if last else of+.6
    if ty=='egg':
        strike(s0+.5,.35); crackle(s0+.7,s0+2.4,7,.04); hiss_bed(s0+.55,s0+2.5,.08); puff(s0+2.45,.3)
        add(tone(scale[i],2.5,.7,((1,1),(2.01,.3),(3,.12))),s0+.7,.09,-.2); continue
    if ty=='fire':
        n=noise(1.4); x=np.arange(len(n))/SR; add(lp(n,.04)*np.clip(x/.5,0,1)*np.exp(-np.maximum(0,x-.6)/.5)*2.5,ig-.1,.6)
        crackle(ig,of+.6,70,.07); hiss_bed(ig,of+.7,.22,.02); puff(of+.55,.4)
    elif ty=='flame':
        n=noise(.5); x=np.arange(len(n))/SR; add(lp(n,.05)*np.exp(-x/.15)*np.clip(x/.03,0,1)*2,ig,.5)
        crackle(ig+.3,of+.5,16,.04); hiss_bed(ig,of+.6,.12); puff(of+.6,.4)
    elif ty=='gas':
        n=noise(.6); x=np.arange(len(n))/SR; add(lp(n,.08)*np.exp(-x/.08)*3,ig,.6); add(np.sin(2*np.pi*(70+60*np.exp(-x*12))*x)*np.exp(-x/.15),ig,.4)
        m=span(ig,of+.3,.1,.3); hs=bp(rng.standard_normal(N),2000,7000); L[:]+=hs*m*.05; R[:]+=hs*m*.05
    elif ty=='bulb':
        click(ig-.02,.5); hum(ig,end_on,.022,120,5)
        if not last: click(of,.35,1900)
    elif ty=='neon':
        for k in range(12): add(bp(noise(.01),1000,6000)*np.exp(-np.arange(int(.01*SR))/SR/.003),ig+rng.random()*.45,.2*rng.random())
        hum(ig,end_on,.03,120,8); 
        if not last: click(of,.3,1500)
    elif ty=='fluor':
        for d in (0,.28,.55): click(ig+d,.3,3200); add(tone(1800,.08,.02),ig+d+.01,.06)
        hum(ig+.55,end_on,.028,100,6)
        if not last: click(of,.3,1700)
    elif ty=='led':
        click(ig-.01,.3,2800); add(tone(2637,.4,.12),ig,.05)
        if not last: click(of,.25,2500)
    elif ty=='smart':
        add(tone(1318.5,1.4,.5,((1,1),(2,.2))),ig,.06,-.2); add(tone(1975.5,1.4,.45),ig+.12,.05,.2)
    add(tone(scale[i],2.5,.7,((1,1),(2.01,.3),(3,.12))),s0+1.2,.10,-.2); add(tone(scale[i]*1.5,2.5,.6),s0+1.32,.05,.2)
XL,XR=L.copy(),R.copy()
# ---------- 和弦鋪底：遠古小調 → 工業 → 電氣大調 → 地球 → 結尾 ----------
def pad(freqs,t0,t1,g,fi=1.5,fo=1.5):
    m=(t>=t0)&(t<t1); x=t[m]-t0; d=t1-t0; e=np.minimum(1,x/fi)*np.minimum(1,(d-x)/fo)
    s=sum(np.sin(2*np.pi*f*x+np.sin(2*np.pi*.2*x+i)*.3)+.3*np.sin(2*np.pi*2*f*x) for i,f in enumerate(freqs))
    add(lp(s*e/len(freqs),.08),t0,g)
st=[e['start'] for e in ERAS]
pad([110,164.8,220,261.6],0,st[5]+.5,.15,fi=2.5)                    # 火的時代：A 小調
pad([98,146.8,196,246.9,293.7],st[5],st[7]+.5,.15)                  # 彩蛋～煤油：G 大調
pad([87.3,130.8,174.6,220,261.6,392],st[7],st[10]+.5,.16)            # 電氣時代：F 大調 add9
pad([130.8,196,261.6,329.6,392,523.3],st[10],TT['OUT0']+1.0,.15)     # LED～今天：C 大調，明亮
pad([73.4,110,146.8,220,293.7,370,440],TT['OUT0']-.6,T,.22,fi=2.5,fo=4.0)   # 地球：D 大調，緩緩收尾
# ---------- 拉遠、熄燈、結尾火柴 ----------
wn=rng.standard_normal(N); a0,a1=TT['OUT0']-.1,TT['OUT1']+1.5; e_=span(a0,a1,1.6,1.4); q=np.clip((t-a0)/(a1-a0),0,1); wind=(lp(wn,.02)*(1-q)+lp(wn,.08)*q)*e_; L+=wind*.5; R+=np.roll(wind,300)*.5; XL+=wind*.5; XR+=np.roll(wind,300)*.5
add(tone(1174.7,4,1.2,((1,1),(2.01,.3))),TT['OUT1']-.5,.09)
# ---------- 殘響、限幅、淡出 ----------
ir=lp(rng.standard_normal(int(1.6*SR)),.12)*np.exp(-np.arange(int(1.6*SR))/SR/.45)*.05
def master(L,R,name):
    L2=L+fftconvolve(L,ir)[:N]*.6; R2=R+fftconvolve(R,ir)[:N]*.6
    mx=max(abs(L2).max(),abs(R2).max()); L2=L2/mx; R2=R2/mx; L2=np.tanh(L2*2.2)/np.tanh(2.2)*.9; R2=np.tanh(R2*2.2)/np.tanh(2.2)*.9
    f=np.clip((T-t)/3.5,0,1); L2*=f; R2*=f
    d=(np.stack([L2,R2],1)*32767).astype('<i2'); w=wave.open(name,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes()); w.close()
master(L,R,'faudio.wav'); master(XL,XR,'sfx_only.wav'); print('ok',T)
