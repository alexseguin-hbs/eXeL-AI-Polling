import sys, json, numpy as np, statistics
sys.path.insert(0,'/home/user/eXeL-AI-Polling/frontend/public/sensor-fusion/edge')
import sensor_fusion_edge as sfe
from PIL import Image
import cv2
R='/home/user/de-risking-strategies/sensorfusion/PreLoadedModels/'
MODELS={'head':'Model02.Head','deer':'Model01.Deer','tree':'Model04.Tree'}
T=json.load(open('testset.json'))
def run(it, arr):
    d=it.get_input_details()[0]; it.set_tensor(d['index'], np.expand_dims(arr,0)); it.invoke()
    o=it.get_output_details()
    b=it.get_tensor(o[0]['index'])[0]; s=it.get_tensor(o[2]['index'])[0]; n=int(it.get_tensor(o[3]['index'])[0])
    s=s[:n]; return (float(s.max()) if n else 0.0), b[0].tolist()
def auc(pos,neg):
    # probability a random positive outscores a random negative
    w=sum((p>q)+0.5*(p==q) for p in pos for q in neg); return w/(len(pos)*len(neg))
for k,folder in MODELS.items():
    it=sfe.interpreter_for(R+folder+'/Sample_TFLite_model/detect.tflite',False); it.allocate_tensors()
    d=it.get_input_details()[0]; H,W=int(d['shape'][1]),int(d['shape'][2])
    out={}
    for var in ['pil_rgb (program)','cv2_rgb_linear (upstream)','cv2_bgr_linear','pil_rgb_letterbox']:
        sc={'pos':[],'neg':[]}; box0=[]
        for kind in ['pos','neg']:
            for i in T['plan'][k][kind]:
                if var.startswith('pil_rgb (program)'):
                    a=np.asarray(Image.open(f'img/{i}.jpg').convert('RGB').resize((W,H)),dtype=np.uint8)
                elif var.startswith('pil_rgb_letterbox'):
                    im=Image.open(f'img/{i}.jpg').convert('RGB'); s_=min(W/im.width,H/im.height)
                    im2=im.resize((max(1,int(im.width*s_)),max(1,int(im.height*s_)))); c=Image.new('RGB',(W,H)); c.paste(im2,((W-im2.width)//2,(H-im2.height)//2)); a=np.asarray(c,dtype=np.uint8)
                else:
                    bgr=cv2.imread(f'img/{i}.jpg'); src=cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB) if 'rgb' in var else bgr
                    a=cv2.resize(src,(W,H)).astype(np.uint8)
                m,b0=run(it,a); sc[kind].append(m); box0.append(tuple(round(x,2) for x in b0))
        out[var]={'auc':round(auc(sc['pos'],sc['neg']),3),'pos_median_top':round(statistics.median(sc['pos']),3),'neg_median_top':round(statistics.median(sc['neg']),3),
                  'pos>0.5':sum(x>0.5 for x in sc['pos']),'neg>0.5':sum(x>0.5 for x in sc['neg']),'pos>0.9':sum(x>0.9 for x in sc['pos']),'neg>0.9':sum(x>0.9 for x in sc['neg']),
                  'distinct_box0':len(set(box0))}
    print(k, folder, f"pos n={len(T['plan'][k]['pos'])} neg n={len(T['plan'][k]['neg'])}")
    for v,r in out.items(): print('   ',f'{v:26}',r)
