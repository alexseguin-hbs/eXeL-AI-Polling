#!/usr/bin/env python3
"""SECURITY-2525 — standalone tactical map renderer (JBLM).
Reads osm-<key>.json (roads/water) + dem-<key>.json (elevation), renders a
phone-openable HTML map: hypsometric relief + hillshade + contour bands, tiered
roads, water, a TRUE UTM 1 km grid (zone 10), scale bar, labels, and the
operator's marked point. Pure stdlib, no network, no deps.

Usage:
  render_jblm_map.py --osm osm-jblm.json --dem dem-jblm.json --out map.html \
     --center 47.0437814,-122.4100435 --box W,S,E,N --title "..." [--mgrs "10T ET 44815 10198"]
"""
import json, math, argparse, html

# ---------- compact WGS84 → UTM forward ----------
def utm(lat, lon):
    a = 6378137.0; f = 1/298.257223563
    e2 = f*(2-f); ep2 = e2/(1-e2)
    zone = int((lon+180)/6)+1
    lon0 = math.radians((zone-1)*6-180+3)
    la = math.radians(lat); lo = math.radians(lon)
    N = a/math.sqrt(1-e2*math.sin(la)**2)
    T = math.tan(la)**2; C = ep2*math.cos(la)**2; A = math.cos(la)*(lo-lon0)
    M = a*((1-e2/4-3*e2**2/64-5*e2**3/256)*la
           -(3*e2/8+3*e2**2/32+45*e2**3/1024)*math.sin(2*la)
           +(15*e2**2/256+45*e2**3/1024)*math.sin(4*la)
           -(35*e2**3/3072)*math.sin(6*la))
    k0=0.9996
    E = k0*N*(A+(1-T+C)*A**3/6+(5-18*T+T*T+72*C-58*ep2)*A**5/120)+500000
    Nn = k0*(M+N*math.tan(la)*(A*A/2+(5-T+9*C+4*C*C)*A**4/24
             +(61-58*T+T*T+600*C-330*ep2)*A**6/720))
    if lat<0: Nn+=10000000
    return zone, E, Nn

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--osm"); ap.add_argument("--dem")
    ap.add_argument("--out", required=True)
    ap.add_argument("--center", required=True)   # lat,lon
    ap.add_argument("--box")                      # W,S,E,N  (else derived from OSM data)
    ap.add_argument("--title", default="SECURITY-2525 · JBLM")
    ap.add_argument("--mgrs", default="")
    ap.add_argument("--note", default="")
    ap.add_argument("--labels", default="")       # "lat:lon:TEXT;..."
    ap.add_argument("--ring", type=float, default=0.0)   # AO radius km (dashed circle at center)
    ap.add_argument("--ci", type=float, default=20.0)    # contour interval metres
    a=ap.parse_args()
    clat,clon=[float(x) for x in a.center.split(",")]

    osm=json.load(open(a.osm)) if a.osm else {"roads":[],"water":[],"waterPolys":[]}
    dem=json.load(open(a.dem)) if a.dem else None

    # ---- render box ----
    if a.box:
        W,S,E,N=[float(x) for x in a.box.split(",")]
    else:
        xs=[]; ys=[]
        for r in osm.get("roads",[]):
            for p in r["p"]: xs.append(p[0]); ys.append(p[1])
        W,E=min(xs),max(xs); S,N=min(ys),max(ys)
    midlat=(S+N)/2
    # projection: SVG px
    H=1180.0
    pxLat=H/(N-S)
    pxLon=pxLat*math.cos(math.radians(midlat))
    Wd=(E-W)*pxLon
    def X(lon): return (lon-W)*pxLon
    def Y(lat): return (N-lat)*pxLat
    Wd_i=int(round(Wd)); H_i=int(round(H))

    # ---- DEM sampler (bilinear) ----
    def dem_at(lat,lon):
        if not dem: return 0.0
        dW,dS,dE,dN=dem["bbox"]; nx,ny=dem["nx"],dem["ny"]; el=dem["elev"]
        fi=(lon-dW)/(dE-dW)*(nx-1); fj=(dN-lat)/(dN-dS)*(ny-1)
        if fi<0 or fi>nx-1 or fj<0 or fj>ny-1: return 0.0
        i0=int(fi); j0=int(fj); i1=min(i0+1,nx-1); j1=min(j0+1,ny-1)
        ti=fi-i0; tj=fj-j0
        def g(i,j): return el[j*nx+i]
        return (g(i0,j0)*(1-ti)*(1-tj)+g(i1,j0)*ti*(1-tj)
                +g(i0,j1)*(1-ti)*tj+g(i1,j1)*ti*tj)

    # ---- elevation relief raster (fine grid of rects) ----
    relief=[]
    contour_edges=[]
    CI=a.ci  # contour interval metres
    if dem:
        GC=150; GR=int(GC*H/Wd)  # fine grid
        cellw=Wd/GC; cellh=H/GR
        # precompute band grid for contour edges
        band=[[0]*(GC+1) for _ in range(GR+1)]
        elg=[[0.0]*(GC+1) for _ in range(GR+1)]
        for gj in range(GR+1):
            lat=N-(gj/GR)*(N-S)
            for gi in range(GC+1):
                lon=W+(gi/GC)*(E-W)
                e=dem_at(lat,lon); elg[gj][gi]=e
                band[gj][gi]=math.floor(max(e,0)/CI)
        # hypsometric + hillshade fill
        emin=min(min(r) for r in elg); emax=max(1.0, max(max(r) for r in elg))
        rng=max(1.0,emax-emin)
        deepest=min(-1.0, emin)   # most-negative GEBCO depth → bathymetry scale
        # light from NW
        lx,ly,lz=-0.6,-0.6,0.53
        mlen=math.sqrt(lx*lx+ly*ly+lz*lz); lx/=mlen;ly/=mlen;lz/=mlen
        def ramp(t):  # t 0..1 -> hypsometric (water-cut handled separately)
            stops=[(0.0,(26,56,74)),(0.12,(37,84,74)),(0.30,(60,104,64)),
                   (0.5,(120,132,70)),(0.7,(150,120,70)),(0.85,(140,96,66)),(1.0,(224,214,200))]
            for k in range(len(stops)-1):
                t0,c0=stops[k]; t1,c1=stops[k+1]
                if t<=t1:
                    f=(t-t0)/max(1e-6,t1-t0)
                    return tuple(int(c0[m]+(c1[m]-c0[m])*f) for m in range(3))
            return stops[-1][1]
        mperpx_x=(E-W)*111320*math.cos(math.radians(midlat))/Wd
        mperpx_y=(N-S)*110574/H
        for gj in range(GR):
            for gi in range(GC):
                e=elg[gj][gi]
                if e<-0.2:
                    dt=min(1.0,(-e)/max(1.0,-deepest))   # 0 shallow → 1 deepest (bathymetry)
                    col=(int(58-52*dt), int(120-100*dt), int(162-112*dt))  # shallow cyan-blue → deep navy
                elif e<=0.5:
                    col=(26,70,96)  # shoreline / MSL flat
                else:
                    t=e/emax     # land hypsometric 0..max (bathymetry no longer squashes land tint)
                    base=ramp(t)
                    # slope normal from neighbours
                    dzx=(elg[gj][gi+1]-e)/max(1.0,cellw*mperpx_x)
                    dzy=(elg[gj+1][gi]-e)/max(1.0,cellh*mperpx_y)
                    nx_,ny_,nz_=-dzx,-dzy,1.0
                    nl=math.sqrt(nx_*nx_+ny_*ny_+nz_*nz_)
                    sh=max(0.0,(nx_*lx+ny_*ly+nz_*lz)/nl)
                    sh=0.55+0.75*sh
                    col=tuple(min(255,int(c*sh)) for c in base)
                relief.append((gi*cellw,gj*cellh,cellw+0.6,cellh+0.6,col))
                # contour edge if band changes to the right / below
                if band[gj][gi]!=band[gj][gi+1]:
                    x=(gi+1)*cellw; contour_edges.append((x,gj*cellh,x,(gj+1)*cellh))
                if band[gj][gi]!=band[gj+1][gi]:
                    y=(gj+1)*cellh; contour_edges.append((gi*cellw,y,(gi+1)*cellw,y))

    # ---- UTM 1 km grid (true north, straight-line affine over the box) ----
    z0,Esw,Nsw=utm(S,W); _,Ese,Nse=utm(S,E); _,Enw,Nnw=utm(N,W)
    # affine (lon,lat)->(E,N): E=Esw+ (lon-W)*dEdlon + (lat-S)*dEdlat ...
    dEdlon=(Ese-Esw)/(E-W); dEdlat=(Enw-Esw)/(N-S)
    dNdlon=(Nse-Nsw)/(E-W); dNdlat=(Nnw-Nsw)/(N-S)
    det=dEdlon*dNdlat-dEdlat*dNdlon
    def lonlat_of(Em,Nm):
        de=Em-Esw; dn=Nm-Nsw
        dlon=( de*dNdlat - dn*dEdlat)/det
        dlat=(-de*dNdlon + dn*dEdlon)/det
        return W+dlon, S+dlat
    Emin=min(Esw,Ese,Enw); Emax=max(Ese, Enw, Esw, Nse*0+Ese)
    Es=[Esw,Ese,Enw,Nse if False else Ese]
    allE=[utm(la,lo)[1] for la,lo in [(S,W),(S,E),(N,W),(N,E)]]
    allN=[utm(la,lo)[2] for la,lo in [(S,W),(S,E),(N,W),(N,E)]]
    E_lo,E_hi=min(allE),max(allE); N_lo,N_hi=min(allN),max(allN)
    grid=[]; glabel=[]
    e0=int(math.ceil(E_lo/1000)*1000)
    while e0<=E_hi:
        lo1,la1=lonlat_of(e0,N_lo); lo2,la2=lonlat_of(e0,N_hi)
        grid.append((X(lo1),Y(la1),X(lo2),Y(la2)))
        glabel.append((X(lo2),Y(la2),f"{int(e0/1000)%100:02d}","E")); e0+=1000
    n0=int(math.ceil(N_lo/1000)*1000)
    while n0<=N_hi:
        lo1,la1=lonlat_of(E_lo,n0); lo2,la2=lonlat_of(E_hi,n0)
        grid.append((X(lo1),Y(la1),X(lo2),Y(la2)))
        glabel.append((X(lo1),Y(la1),f"{int(n0/1000)%100:02d}","N")); n0+=1000

    # ---- SVG build ----
    sv=[]
    sv.append(f'<svg viewBox="0 0 {Wd_i} {H_i}" xmlns="http://www.w3.org/2000/svg" '
              f'style="width:100%;height:auto;display:block;background:#0a1018">')
    sv.append(f'<rect x="0" y="0" width="{Wd_i}" height="{H_i}" fill="#0b1b22"/>')
    # relief
    for (x,y,w,h,c) in relief:
        sv.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="rgb{c}"/>')
    # contour lines
    if contour_edges:
        d="".join(f"M{x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}" for (x1,y1,x2,y2) in contour_edges)
        sv.append(f'<path d="{d}" stroke="#0d2a16" stroke-width="0.6" fill="none" opacity="0.55"/>')
    # water polys + lines
    for poly in osm.get("waterPolys",[]):
        if len(poly)<3: continue
        d="M"+" L".join(f"{X(p[0]):.1f} {Y(p[1]):.1f}" for p in poly)+" Z"
        sv.append(f'<path d="{d}" fill="#15506e" stroke="#2b7fb0" stroke-width="0.8" opacity="0.92"/>')
    for ln in osm.get("water",[]):
        if len(ln)<2: continue
        d="M"+" L".join(f"{X(p[0]):.1f} {Y(p[1]):.1f}" for p in ln)
        sv.append(f'<path d="{d}" stroke="#3b9fd6" stroke-width="1.4" fill="none" opacity="0.9"/>')
    # roads by tier (draw low tiers first)
    tstyle={2:("#6b7682",0.9,0.8),3:("#c7a24a",1.7,0.95),4:("#f2c14e",3.0,1.0)}
    for t in (2,3,4):
        col,wdt,op=tstyle[t]
        seg=[]
        for r in osm.get("roads",[]):
            if r["t"]!=t: continue
            seg.append("M"+" L".join(f"{X(p[0]):.1f} {Y(p[1]):.1f}" for p in r["p"]))
        if seg:
            sv.append(f'<path d="{"".join(seg)}" stroke="{col}" stroke-width="{wdt}" '
                      f'fill="none" opacity="{op}" stroke-linejoin="round" stroke-linecap="round"/>')
    # UTM grid
    for (x1,y1,x2,y2) in grid:
        sv.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
                  f'stroke="#1ad1e6" stroke-width="0.5" opacity="0.28"/>')
    for (x,y,txt,ax) in glabel:
        xx=max(10,min(Wd_i-16,x+ (3 if ax=="N" else 0)))
        yy=max(14,min(H_i-4,y+ (12 if ax=="E" else -3)))
        sv.append(f'<text x="{xx:.0f}" y="{yy:.0f}" fill="#1ad1e6" font-size="11" '
                  f'font-family="monospace" opacity="0.8">{txt}</text>')
    # AO ring (operator: 42 km circle around JBLM center)
    if a.ring>0:
        rpx=a.ring*(H/((N-S)*110.574))
        cx,cy=X(clon),Y(clat)
        sv.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{rpx:.1f}" fill="none" stroke="#1ad1e6" '
                  f'stroke-width="2" stroke-dasharray="10 7" opacity="0.8"/>')
        sv.append(f'<text x="{cx:.1f}" y="{cy-rpx-8:.1f}" fill="#1ad1e6" font-size="14" '
                  f'font-family="monospace" text-anchor="middle" paint-order="stroke" stroke="#0a1018" '
                  f'stroke-width="2.4">AO {a.ring:.0f} km</text>')
    # labels
    lab=[]
    if a.labels:
        for item in a.labels.split(";"):
            if not item.strip(): continue
            la,lo,tx=item.split(":",2); lab.append((float(la),float(lo),tx))
    for (la,lo,tx) in lab:
        x,y=X(lo),Y(la)
        if x<0 or x>Wd_i or y<0 or y>H_i: continue
        sv.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.2" fill="#ffd54a" stroke="#0a1018" stroke-width="1"/>')
        sv.append(f'<text x="{x+6:.1f}" y="{y-5:.1f}" fill="#ffe08a" font-size="14" '
                  f'font-family="monospace" font-weight="bold" paint-order="stroke" '
                  f'stroke="#0a1018" stroke-width="2.4">{html.escape(tx)}</text>')
    # operator point
    ox,oy=X(clon),Y(clat)
    sv.append(f'<circle cx="{ox:.1f}" cy="{oy:.1f}" r="13" fill="none" stroke="#ff3b3b" stroke-width="2.4"/>')
    sv.append(f'<circle cx="{ox:.1f}" cy="{oy:.1f}" r="2.6" fill="#ff3b3b"/>')
    sv.append(f'<line x1="{ox:.1f}" y1="{oy-20:.1f}" x2="{ox:.1f}" y2="{oy-13:.1f}" stroke="#ff3b3b" stroke-width="2.4"/>')
    sv.append(f'<line x1="{ox:.1f}" y1="{oy+13:.1f}" x2="{ox:.1f}" y2="{oy+20:.1f}" stroke="#ff3b3b" stroke-width="2.4"/>')
    ptxt=(a.mgrs or f"{clat:.5f}, {clon:.5f}")
    sv.append(f'<text x="{ox+18:.1f}" y="{oy+4:.1f}" fill="#ff8a8a" font-size="14" '
              f'font-family="monospace" font-weight="bold" paint-order="stroke" '
              f'stroke="#0a1018" stroke-width="3">{html.escape(ptxt)}</text>')
    # scale bar (1 km in px)
    kmpx=1000.0/((E-W)*111320*math.cos(math.radians(midlat))/Wd)
    sbx,sby=24,H_i-30
    sv.append(f'<rect x="{sbx-8}" y="{sby-20}" width="{kmpx*5+70:.0f}" height="40" fill="#0a1018" opacity="0.55" rx="4"/>')
    for k in range(5):
        fill="#eaf2f6" if k%2==0 else "#0a1018"
        sv.append(f'<rect x="{sbx+kmpx*k:.1f}" y="{sby:.1f}" width="{kmpx:.1f}" height="7" fill="{fill}" stroke="#eaf2f6" stroke-width="0.6"/>')
    sv.append(f'<text x="{sbx:.0f}" y="{sby-6:.0f}" fill="#eaf2f6" font-size="12" font-family="monospace">0</text>')
    sv.append(f'<text x="{sbx+kmpx*5-6:.0f}" y="{sby-6:.0f}" fill="#eaf2f6" font-size="12" font-family="monospace">5 km</text>')
    # north arrow
    nx0=Wd_i-40
    sv.append(f'<polygon points="{nx0},24 {nx0-8},44 {nx0},37 {nx0+8},44" fill="#1ad1e6"/>')
    sv.append(f'<text x="{nx0}" y="20" fill="#1ad1e6" font-size="12" font-family="monospace" text-anchor="middle">N</text>')
    sv.append('</svg>')
    svg="".join(sv)

    # stats
    nr=len(osm.get("roads",[])); nw=len(osm.get("water",[])); npoly=len(osm.get("waterPolys",[]))
    elo=ehi="—"
    if dem:
        fe=[e for e in dem["elev"]]; elo=f"{min(fe):.0f}"; ehi=f"{max(fe):.0f}"
    z,_,_=utm(clat,clon)

    doc=f"""<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{html.escape(a.title)}</title>
<style>
:root{{color-scheme:dark}}
*{{box-sizing:border-box}}
body{{margin:0;background:#0a1018;color:#cfe6ee;font-family:ui-monospace,Menlo,Consolas,monospace}}
.wrap{{max-width:1300px;margin:0 auto;padding:12px}}
h1{{font-size:15px;letter-spacing:.06em;color:#1ad1e6;margin:4px 0 2px}}
.sub{{font-size:12px;color:#86a7b2;margin:0 0 10px}}
.legend{{display:flex;flex-wrap:wrap;gap:8px 16px;font-size:12px;margin:10px 2px 0;color:#9fc0cc}}
.sw{{display:inline-block;width:14px;height:8px;border-radius:2px;vertical-align:middle;margin-right:5px}}
.grid{{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12px;color:#7fa2ae;margin-top:8px}}
.k{{color:#1ad1e6}}
.note{{font-size:12px;color:#d9a441;margin-top:10px;line-height:1.4}}
.map{{border:1px solid #16343f;border-radius:6px;overflow:hidden;background:#0b1b22}}
</style></head><body><div class="wrap">
<h1>{html.escape(a.title)}</h1>
<p class="sub">Operator point <span class="k">{html.escape(a.mgrs or '')}</span> · {clat:.6f}, {clon:.6f} · UTM zone {z} · grid = 1 km (true north)</p>
<div class="map">{svg}</div>
<div class="legend">
<span><span class="sw" style="background:#f2c14e"></span>Hwy / primary (I-5, US-507)</span>
<span><span class="sw" style="background:#c7a24a"></span>Secondary / tertiary</span>
<span><span class="sw" style="background:#6b7682"></span>Local / service</span>
<span><span class="sw" style="background:#2b7fb0"></span>Water (lakes / inlets)</span>
<span><span class="sw" style="background:#3b9fd6"></span>River / stream</span>
<span><span class="sw" style="background:#2b6e3a"></span>Relief + 20 m contours</span>
<span><span class="sw" style="background:#ff3b3b"></span>Your point</span>
</div>
<div class="grid">
<span>roads <span class="k">{nr}</span></span><span>rivers <span class="k">{nw}</span></span>
<span>water bodies <span class="k">{npoly}</span></span>
<span>elev <span class="k">{elo}..{ehi} m</span> MSL</span>
<span>box <span class="k">W{W:.3f} S{S:.3f} E{E:.3f} N{N:.3f}</span></span>
</div>
<p class="note">{html.escape(a.note)}</p>
<p class="sub" style="margin-top:8px">Data © OpenStreetMap contributors (ODbL) · elevation {('opentopodata' if dem else '—')} · SECURITY-2525 Mission Planning</p>
</div></body></html>"""
    open(a.out,"w").write(doc)
    print(f"wrote {a.out}  ({len(doc)//1024} KB)  roads={nr} water={nw} polys={npoly} elev={elo}..{ehi}")

if __name__=="__main__":
    main()
