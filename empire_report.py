"""Self-contained Anno empire summary PDF. Receives the same snapshot as the UI."""
import io
import json
import math
import threading
from functools import lru_cache
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab import rl_config
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, PageBreak, Flowable, Image as PdfImage
from reportlab.lib.utils import ImageReader
from PIL import Image


@lru_cache(maxsize=32)
def report_photo(path):
    # Print-sized thumbnails avoid embedding multi-megapixel source artwork.
    with Image.open(path) as original:
        photo=original.convert('RGB');photo.thumbnail((720,360),Image.Resampling.LANCZOS)
        encoded=io.BytesIO();photo.save(encoded,format='JPEG',quality=88,optimize=True)
    encoded.seek(0)
    return ImageReader(encoded)


class RegionPhoto(Flowable):
    def __init__(self,path,width,height):
        Flowable.__init__(self)
        self.path=path;self.width=width;self.height=height

    def draw(self):
        image=report_photo(str(self.path));width,height=image.getSize()
        scale=max(self.width/width,self.height/height)
        self.canv.saveState()
        clip=self.canv.beginPath();clip.rect(0,0,self.width,self.height)
        self.canv.clipPath(clip,stroke=0,fill=0)
        self.canv.drawImage(image,(self.width-width*scale)/2,(self.height-height*scale)/2,width*scale,height*scale,mask='auto')
        self.canv.restoreState()

PDF_LOCK=threading.Lock()
BLUE=colors.HexColor('#183b60');GOLD=colors.HexColor('#c6a767');INK=colors.HexColor('#182c42');MUTED=colors.HexColor('#637182');PAPER=colors.HexColor('#f5f1e9')

def build_empire_pdf(payload):
    with PDF_LOCK:return _build(payload)

def _build(payload):
    snapshot=payload.get('snapshot') or {};areas=snapshot.get('areas') or []
    if not isinstance(areas,list) or len(areas)>1000:raise ValueError('Invalid report areas')
    labels=payload.get('labels') or {};names=payload.get('names') or {};lang=payload.get('language','en')
    def text(key):return str(labels.get(key) or key)
    fonts=Path(__import__('reportlab').__file__).parent/'fonts'
    if 'Companion' not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont('Companion',str(fonts/'Vera.ttf')))
        pdfmetrics.registerFont(TTFont('CompanionBold',str(fonts/'VeraBd.ttf')))
    base,bold='Companion','CompanionBold'
    cid={'ja':'HeiseiKakuGo-W5','ko':'HYSMyeongJo-Medium','zh-CN':'STSong-Light','zh-TW':'MSung-Light'}.get(lang)
    if cid:
        if cid not in pdfmetrics.getRegisteredFontNames():pdfmetrics.registerFont(UnicodeCIDFont(cid))
        base=bold=cid
    def style(name,size=9,color=INK,**kwargs):
        options=dict(fontName=base,fontSize=size,leading=size*1.45,textColor=color);options.update(kwargs);return ParagraphStyle(name,**options)
    normal=style('body');small=style('small',7.5,MUTED);heading=style('heading',16,BLUE,spaceBefore=18,spaceAfter=9,fontName=bold,keepWithNext=True)
    caption=style('card-caption',6.8,MUTED,leading=8.5)
    cell=style('cell',8);white=style('white',8,colors.white,fontName=bold)
    def para(value,sty=normal):return Paragraph(escape(str(value)),sty)
    def num(value):
        try:n=float(value or 0)
        except (ValueError,TypeError):return '-'
        return f'{n:,.2f}'.rstrip('0').rstrip('.') if math.isfinite(n) else '-'
    rows=[];products=set()
    for area in areas:
        for entry in area.get('entries',[]):
            if not isinstance(entry,dict):raise ValueError('Invalid report entry')
            rows.append((area,entry));products.add(entry.get('ProductGuid'))
    if len(rows)>20000:raise ValueError('Report contains too many product rows')
    gaps=sorted([(a,e) for a,e in rows if float(e.get('ProductDelta',0))<-.01],key=lambda pair:pair[1]['ProductDelta'])
    routes=sorted(snapshot.get('supply_suggestions') or [],key=lambda s:-s.get('suggested_rate',0))
    has_cached=any(a.get('cached') or a.get('stale') for a in areas)
    has_live=any(not (a.get('cached') or a.get('stale')) for a in areas)
    mode='DEMO' if snapshot.get('synthetic') else 'RECORDED' if payload.get('isDemo') else 'LIVE + CACHED' if has_cached and has_live else 'CACHED' if snapshot.get('data_mode')=='cached' or has_cached else 'LIVE'
    row_mode='DEMO' if snapshot.get('synthetic') else 'RECORDED' if payload.get('isDemo') else 'LIVE'
    if not areas and not payload.get('isDemo'):mode='WAITING'
    generated=datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    buffer=io.BytesIO();doc=SimpleDocTemplate(buffer,pagesize=(595.28,841.89),rightMargin=42,leftMargin=42,topMargin=50,bottomMargin=45,title='Anno 117 - Empire Summary',author='Anno 117 Companion')
    width=doc.width;story=[]
    dashboard=Path(__file__).resolve().parent/'android-probe/app/src/main/assets/dashboard'
    icon_paths=json.JSONDecoder().raw_decode((dashboard/'icons.js').read_text(encoding='utf-8').split('=',1)[1])[0]
    def good(guid,name,cell_width):
        relative=icon_paths.get(str(guid));path=(dashboard/relative).resolve() if relative else None
        if not path or not path.is_relative_to(dashboard.resolve()) or not path.is_file():return para(name,cell)
        picture=PdfImage(str(path),width=24,height=24,kind='proportional')
        item=Table([[picture,para(name,cell)]],colWidths=[30,cell_width-48])
        item.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0)]))
        return item
    def table(headers,data,widths):
        material=[[para(h,white) for h in headers]]+[[v if isinstance(v,Flowable) else para(v,cell) for v in row] for row in data]
        result=Table(material,colWidths=widths,repeatRows=1,hAlign='LEFT')
        result.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUE),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#eef2f7')]),('LINEBELOW',(0,0),(-1,0),1,GOLD),('LINEBELOW',(0,1),(-1,-1),.3,colors.HexColor('#dce3ec'))]))
        return result
    story.extend([para('ANNO 117 / THE COMPANION',style('brand',9,BLUE,spaceAfter=12)),para(text('Empire Summary'),style('title',29,BLUE,fontName=bold,spaceAfter=9)),para(str(snapshot.get('session_name') or text('Your empire')),style('session',14,MUTED)),Spacer(1,12),para(mode+'  /  '+generated,small),Spacer(1,21)])
    metrics=Table([[para(text('Islands'),small),para(text('Products'),small),para(text('Local gaps'),small),para(text('Supply suggestions'),small)], [para(str(len(areas)),style('metric',23,BLUE,fontName=bold)),para(str(len(products)),style('metric',23,BLUE,fontName=bold)),para(str(len(gaps)),style('metric',23,BLUE,fontName=bold)),para(str(len(routes)),style('metric',23,BLUE,fontName=bold))]],colWidths=[width/4]*4)
    metrics.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PAPER),('TOPPADDING',(0,0),(-1,0),12),('BOTTOMPADDING',(0,1),(-1,1),13),('LEFTPADDING',(0,0),(-1,-1),12)]));story.append(metrics)
    story.extend([Spacer(1,15),para(text('Local balances exclude imports and warehouse stock.'),small)])
    if mode=='CACHED':story.append(para(text('Cached: using last known game data.')+' '+str(snapshot.get('last_data_at') or ''),small))
    story.append(para(text('Island briefing'),heading))
    island_rows=[]
    for area in sorted(areas,key=lambda a:-sum(e.get('ProductDelta',0)<-.01 for e in a.get('entries',[]))):
        entries=area.get('entries',[]);age=area.get('age_seconds')
        status=text('Cached') if not payload.get('isDemo') and (area.get('cached') or area.get('stale')) else row_mode
        if age is not None:status+=' / '+(str(int(age)//60)+'m '+str(int(age)%60)+'s' if age>=60 else str(int(age))+'s')
        island_rows.append([area.get('area_name','-'),str(len(entries)),str(sum(e.get('ProductDelta',0)<-.01 for e in entries)),status])
    artwork=Path(__file__).resolve().parent/'android-probe/app/src/main/assets/dashboard/islands'
    cards=[];card_width=width/3-8
    for area,values in zip(sorted(areas,key=lambda a:-sum(e.get('ProductDelta',0)<-.01 for e in a.get('entries',[]))),island_rows):
        region='albion' if area.get('session_guid')==6627 else 'latium'
        pictures=sorted(artwork.glob(region+'-*.webp'),key=lambda p:int(p.stem.rsplit('-',1)[1]))
        neighbours=sorted(':'.join(str(a.get(k)) for k in ['session_id','island_id','area_index']) for a in areas if (a.get('session_guid')==6627)==(region=='albion'))
        identity=':'.join(str(area.get(k)) for k in ['session_id','island_id','area_index'])
        content=[]
        if pictures:content.extend([RegionPhoto(pictures[neighbours.index(identity)%len(pictures)],card_width-14,62),Spacer(1,5)])
        content.extend([para(values[0],style('island-name',10,BLUE,fontName=bold)),para(region.upper()+' / '+text('Region artwork'),caption),para(text('Product rows')+': '+values[1]+' / '+text('Local gaps')+': '+values[2]+' / '+text('Surpluses')+': '+str(sum(e.get('ProductDelta',0)>.01 for e in area.get('entries',[]))),caption),para(values[3],caption)])
        card=Table([[content]],colWidths=[card_width])
        card.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PAPER),('BOX',(0,0),(-1,-1),.4,colors.HexColor('#dce3ec')),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7)]))
        cards.append(card)
    if cards:
        grid=[cards[i:i+3]+['']*(3-len(cards[i:i+3])) for i in range(0,len(cards),3)]
        grid_table=Table(grid,colWidths=[width/3]*3,hAlign='LEFT')
        grid_table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
        story.append(grid_table)
    story.extend([PageBreak(),para(text('Priority local gaps'),heading)])
    gap_rows=[]
    for area,e in gaps[:15]:
        name=names.get(str(e['ProductGuid'])) or e.get('ProductNameEnglish') or str(e['ProductGuid'])
        gap_rows.append([good(e['ProductGuid'],name,width*.29),area.get('area_name','-'),num(e.get('ProductGeneration')),num(e.get('ProductConsumption')),num(e['ProductDelta'])])
    story.append(table([text('Good'),text('Island'),text('Production'),text('Consumption'),text('Local balance')],gap_rows,[width*.29,width*.24,width*.15,width*.16,width*.16]) if gap_rows else para(text('No local gaps')))
    story.extend([PageBreak(),para(text('Supply suggestions'),heading)])
    transfer_rows=[]
    for route in routes[:15]:
        name=names.get(str(route['product_guid'])) or route.get('product_name') or str(route['product_guid'])
        transfer_rows.append([good(route['product_guid'],name,width*.25),route.get('from_area','-'),route.get('to_area','-'),num(route.get('suggested_rate')),text('Cached') if route.get('cached') else row_mode])
    story.append(table([text('Good'),text('Source island'),text('Destination island'),text('Suggested rate'),text('Data status')],transfer_rows,[width*.25,width*.24,width*.24,width*.14,width*.13]) if transfer_rows else para(text('No transfer matches yet')))
    story.extend([Spacer(1,16),para(text('Report scope'),heading),para(text('Rate units need in-game verification. Building counts are estimates.'),small),Spacer(1,5),para(text('Suggestions use last known local balances. They are not trade orders. Cached data stays unchanged until the game publishes new statistics.'),small),Spacer(1,5),para(text('This report shows the first 15 local gaps and 15 transfer suggestions, plus every received island.'),small)])
    def page(canvas,document):
        canvas.setStrokeColor(GOLD);canvas.setLineWidth(1);canvas.line(42,815,553,815)
        canvas.setFont(base,7);canvas.setFillColor(MUTED);canvas.drawString(42,25,'ANNO 117 COMPANION / '+mode);canvas.drawRightString(553,25,str(document.page))
    doc.build(story,onFirstPage=page,onLaterPages=page)
    return buffer.getvalue()
