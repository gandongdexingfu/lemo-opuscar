import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
SRC=sys.argv[1]  # 空白招牌底圖（assets 分支 covers/ 內）
FONT="/usr/share/fonts/opentype/noto/NotoSerifCJK-Black.ttc"
base=Image.open(SRC).convert("RGB"); W,H=base.size
x0,y0,x1,y1=125,262,868,488          # blank plaque field
cx,cy=(x0+x1)/2,(y0+y1)/2
text="重庆火锅"; size=160; gap=19
f=ImageFont.truetype(FONT,size,index=2)

# glyph mask, evenly spaced characters, centred in the field
mask=Image.new("L",(W,H),0); d=ImageDraw.Draw(mask)
ws=[d.textlength(c,font=f) for c in text]; total=sum(ws)+gap*(len(text)-1)
x=cx-total/2
bb=d.textbbox((0,0),"重",font=f); th=bb[3]-bb[1]; ty=cy-th/2-bb[1]
for c,w in zip(text,ws):
    d.text((x,ty),c,font=f,fill=255); x+=w+gap
m=np.array(mask).astype(float)/255

def blur(a,r): return np.array(Image.fromarray((a*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(float)/255
def shift(a,dx,dy): return np.roll(np.roll(a,dy,0),dx,1)

out=np.array(base).astype(float)/255
# 1) carved shadow on the lacquer (light from upper-left lanterns)
sh=blur(shift(m,7,9),6)*0.75
out*= (1-sh[...,None]*0.85)
# 2) gold leaf fill: vertical gradient per line + subtle horizontal sheen
yy=np.linspace(0,1,H)[:,None]; t=np.clip((yy*H-(cy-th/2))/th,0,1)
top=np.array([1.00,0.93,0.66]); mid=np.array([0.86,0.63,0.22]); bot=np.array([0.58,0.36,0.10])
g=np.where(t[...,None]<0.5, top+(mid-top)*(t[...,None]/0.5), mid+(bot-mid)*((t[...,None]-0.5)/0.5))
g=np.broadcast_to(g,(H,W,3)).copy()
xx=np.linspace(0,1,W)[None,:]; sheen=0.10*np.sin(xx*np.pi*3.2+yy*4)
g=np.clip(g+sheen[...,None],0,1)
# 3) bevel: highlight on upper-left edges, shade on lower-right edges
sb=blur(m,2.2)
hl=np.clip(shift(sb,-2,-2)-sb,0,1)   # wait: inverted below
bev_light=np.clip(sb-shift(sb,3,3),0,1)*m
bev_dark=np.clip(sb-shift(sb,-3,-3),0,1)*m
g=g*(1-0.55*bev_dark[...,None])+0.65*bev_light[...,None]
# fine gold texture
rng=np.random.default_rng(3); n=blur(rng.random((H,W)),0.8)
g=np.clip(g*(0.94+0.12*n[...,None]),0,1)
ma=blur(m,0.6)[...,None]
out=out*(1-ma)+g*ma
# 4) faint warm glow around letters (lantern bounce)
glow=blur(m,14)*0.18
out=np.clip(out+glow[...,None]*np.array([1.0,0.6,0.25]),0,1)
res=Image.fromarray((out*255).astype(np.uint8))
res.save(sys.argv[2],quality=93)
print("ok", W,H, "text box", round(cx-total/2),round(cx+total/2))
