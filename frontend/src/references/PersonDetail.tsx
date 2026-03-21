/**
 * CineVault — Person Detail Page (/person/:id)
 * Example: Andrei Tarkovsky
 * Actor · Crew with sub-tabs · Filmography · Bio · Community stats
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Bell, Share2, Users, Film,
  MapPin, Calendar, Award, ChevronDown, ChevronUp,
  Bookmark, Star, ExternalLink,
} from 'lucide-react';

// ─── PALETTE ─────────────────────────────────────────────────
const C = {
  bg: '#080808', surface: '#111111', elevated: '#1A1A1A',
  border: '#252525', accent: '#D4AF7A', accentDim: '#9A7A48',
  accentGlow: 'rgba(212,175,122,0.12)', text: '#E2E2E2',
  textSoft: '#7A7A7A', textMuted: '#3A3A3A', gold: '#C8A96E',
} as const;
const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'Syne', sans-serif";

function Img({ src, alt, style, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [e, setE] = useState(false);
  if (e) return <div style={{ ...style, background: C.elevated }} />;
  return <img src={src} alt={alt} style={style} onError={() => setE(true)} {...rest} />;
}
function Grain() {
  return <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:900,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,opacity:0.38}} />;
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize:10,letterSpacing:'0.28em',textTransform:'uppercase',color:C.accent,marginBottom:20,display:'flex',alignItems:'center',gap:14,fontFamily:SANS }}>
      {children}
      <div style={{ flex:1,height:1,background:`linear-gradient(to right, ${C.border}, transparent)` }}/>
    </div>
  );
}

// ─── DATA ────────────────────────────────────────────────────
type FilmCredit = { year:number; title:string; originalTitle:string; genres:string[]; duration:string; rating:number; img:string; id:string; role?:string; secondary?:boolean };

const PERSON = {
  id:'tarkovsky', name:'Andrei Tarkovsky', originalName:'Андрей Тарковский',
  born:'4 abr. 1932', died:'29 dic. 1986', age:54,
  birthplace:'Zavrazhye, URSS', nationality:'Soviético · Ruso',
  primaryRole:'Director',
  portrait:'https://images.unsplash.com/photo-1683797008263-cac0982c1dd7?w=800&q=85',
  heroBg:'https://images.unsplash.com/photo-1659933021944-d42680e82c80?w=1600&q=85',
  stats:{ fans:4821, inWatchlists:28400, avgRating:4.7, totalFilms:7 },
  awards:['León de Oro — Venecia 1962','Premio del Jurado — Cannes 1980','Premio FIPRESCI — Cannes 1980','Premio especial — Cannes 1983'],
  bio:`Andrei Arsenyevich Tarkovsky fue uno de los cineastas más influyentes del siglo XX. Su obra — caracterizada por imágenes oníricas, largos planos secuencia y una reflexión sostenida sobre la espiritualidad, el tiempo y la memoria — redefinió los límites del lenguaje cinematográfico.\n\nFormado en el Instituto Estatal de Cinematografía de Moscú (VGIK) bajo la tutela de Mikhail Romm, su ópera prima La infancia de Iván (1962) ganó el León de Oro en Venecia con tan solo 30 años. Sus películas posteriores — Andrei Rublev, Solaris, El espejo, Stalker, Nostalghia y El Sacrificio — son consideradas obras maestras absolutas del cine de autor.\n\nMurió en París el 29 de diciembre de 1986, a los 54 años, víctima de un cáncer de pulmón, mientras se encontraba en el exilio voluntario del que nunca regresó. Su libro Esculpir en el tiempo (1984) permanece como uno de los ensayos cinematográficos más importantes jamás escritos.`,
  knownFor:[
    {title:'Stalker',year:1979,img:'https://images.unsplash.com/photo-1648256289719-9ebbd79faaa5?w=400&q=80',id:'stalker',rating:4.4},
    {title:'Andrei Rublev',year:1966,img:'https://images.unsplash.com/photo-1717446871833-dc6420252a30?w=400&q=80',id:'andrei-rublev',rating:4.5},
    {title:'El espejo',year:1975,img:'https://images.unsplash.com/photo-1706460400799-bd339797d306?w=400&q=80',id:'el-espejo',rating:4.3},
    {title:'Solaris',year:1972,img:'https://images.unsplash.com/photo-1769121803735-59cde1085231?w=400&q=80',id:'solaris',rating:4.2},
    {title:'Nostalghia',year:1983,img:'https://images.unsplash.com/photo-1767462587452-6a7fa99cc961?w=400&q=80',id:'nostalghia',rating:4.3},
    {title:'El Sacrificio',year:1986,img:'https://images.unsplash.com/photo-1698159929266-28e8e8ef6b33?w=400&q=80',id:'el-sacrificio',rating:4.1},
  ],
  crew:{
    director:[
      {year:1986,title:'El Sacrificio',originalTitle:'Offret',genres:['Drama','Filosófico'],duration:'149 min',rating:4.1,img:'https://images.unsplash.com/photo-1698159929266-28e8e8ef6b33?w=200&q=80',id:'el-sacrificio'},
      {year:1983,title:'Nostalghia',originalTitle:'Nostalghia',genres:['Drama','Slow cinema'],duration:'126 min',rating:4.3,img:'https://images.unsplash.com/photo-1767462587452-6a7fa99cc961?w=200&q=80',id:'nostalghia'},
      {year:1979,title:'Stalker',originalTitle:'Сталкер',genres:['Sci-fi','Drama'],duration:'162 min',rating:4.4,img:'https://images.unsplash.com/photo-1648256289719-9ebbd79faaa5?w=200&q=80',id:'stalker'},
      {year:1975,title:'El espejo',originalTitle:'Зеркало',genres:['Drama','Autobiográfico'],duration:'108 min',rating:4.3,img:'https://images.unsplash.com/photo-1706460400799-bd339797d306?w=200&q=80',id:'el-espejo'},
      {year:1972,title:'Solaris',originalTitle:'Солярис',genres:['Sci-fi','Filosófico'],duration:'167 min',rating:4.2,img:'https://images.unsplash.com/photo-1769121803735-59cde1085231?w=200&q=80',id:'solaris'},
      {year:1966,title:'Andrei Rublev',originalTitle:'Андрей Рублёв',genres:['Drama','Histórico'],duration:'205 min',rating:4.5,img:'https://images.unsplash.com/photo-1717446871833-dc6420252a30?w=200&q=80',id:'andrei-rublev'},
      {year:1962,title:'La infancia de Iván',originalTitle:'Иваново детство',genres:['Drama','Bélico'],duration:'95 min',rating:4.2,img:'https://images.unsplash.com/photo-1770896689026-f5421714f6a5?w=200&q=80',id:'ivan-childhood'},
    ] as FilmCredit[],
    writer:[
      {year:1983,title:'Nostalghia',originalTitle:'Nostalghia',genres:['Drama'],duration:'126 min',rating:4.3,img:'https://images.unsplash.com/photo-1767462587452-6a7fa99cc961?w=200&q=80',id:'nostalghia'},
      {year:1979,title:'Stalker',originalTitle:'Сталкер',genres:['Sci-fi'],duration:'162 min',rating:4.4,img:'https://images.unsplash.com/photo-1648256289719-9ebbd79faaa5?w=200&q=80',id:'stalker'},
      {year:1975,title:'El espejo',originalTitle:'Зеркало',genres:['Drama'],duration:'108 min',rating:4.3,img:'https://images.unsplash.com/photo-1706460400799-bd339797d306?w=200&q=80',id:'el-espejo'},
      {year:1966,title:'Andrei Rublev',originalTitle:'Андрей Рублёв',genres:['Drama'],duration:'205 min',rating:4.5,img:'https://images.unsplash.com/photo-1717446871833-dc6420252a30?w=200&q=80',id:'andrei-rublev'},
      {year:1962,title:'La infancia de Iván',originalTitle:'Иваново детство',genres:['Drama'],duration:'95 min',rating:4.2,img:'https://images.unsplash.com/photo-1770896689026-f5421714f6a5?w=200&q=80',id:'ivan-childhood'},
    ] as FilmCredit[],
    producer:[
      {year:1986,title:'El Sacrificio',originalTitle:'Offret',genres:['Drama'],duration:'149 min',rating:4.1,img:'https://images.unsplash.com/photo-1698159929266-28e8e8ef6b33?w=200&q=80',id:'el-sacrificio'},
      {year:1983,title:'Nostalghia',originalTitle:'Nostalghia',genres:['Drama'],duration:'126 min',rating:4.3,img:'https://images.unsplash.com/photo-1767462587452-6a7fa99cc961?w=200&q=80',id:'nostalghia'},
    ] as FilmCredit[],
  },
  actor:[
    {year:1964,title:'Katok i skripka',originalTitle:'Каток и скрипка',role:'Cameo',secondary:true,genres:['Cortometraje'],duration:'46 min',rating:3.8,img:'https://images.unsplash.com/photo-1762948050110-76e67d7aae29?w=200&q=80',id:'katok'},
    {year:1960,title:'Ubiytsy',originalTitle:'Убийцы',role:'Papel secundario',secondary:true,genres:['Drama','Cortometraje'],duration:'20 min',rating:3.5,img:'https://images.unsplash.com/photo-1659933021944-d42680e82c80?w=200&q=80',id:'ubiytsy'},
  ] as FilmCredit[],
};

// ─── NAVBAR ──────────────────────────────────────────────────
function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 60); window.addEventListener('scroll',h); return () => window.removeEventListener('scroll',h); }, []);
  return (
    <nav style={{ position:'fixed',top:0,left:0,right:0,zIndex:200,height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 52px',background:scrolled?'rgba(8,8,8,0.97)':'linear-gradient(to bottom,rgba(8,8,8,0.97),transparent)',backdropFilter:scrolled?'blur(20px)':'none',borderBottom:scrolled?`1px solid ${C.border}`:'1px solid transparent',transition:'all 0.4s' }}>
      <Link to="/" style={{ fontFamily:SERIF,fontSize:21,fontWeight:500,letterSpacing:'0.13em',textTransform:'uppercase',color:C.text,textDecoration:'none' }}>
        Cine<span style={{color:C.accent}}>Vault</span>
      </Link>
      <button onClick={() => navigate(-1)} style={{ display:'flex',alignItems:'center',gap:8,fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:C.textSoft,background:'none',border:'none',cursor:'pointer',fontFamily:SANS,transition:'color 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.color=C.text)} onMouseLeave={e=>(e.currentTarget.style.color=C.textSoft)}>
        <ChevronLeft size={14} strokeWidth={1.5}/> Volver
      </button>
    </nav>
  );
}

// ─── HERO ────────────────────────────────────────────────────
function PersonHero({ following, onFollow }: { following:boolean; onFollow:()=>void }) {
  return (
    <div style={{ position:'relative',height:'70vh',minHeight:560,overflow:'hidden' }}>
      {/* Atmospheric background */}
      <Img src={PERSON.heroBg} alt="" style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',filter:'saturate(0.3) brightness(0.45)',transform:'scale(1.04)' }}/>
      <div style={{ position:'absolute',inset:0,background:'linear-gradient(to right, rgba(8,8,8,0.98) 0%, rgba(8,8,8,0.82) 45%, rgba(8,8,8,0.3) 70%, transparent 100%)' }}/>
      <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top, rgba(8,8,8,0.98) 0%, transparent 55%)' }}/>
      {/* Accent glow */}
      <div style={{ position:'absolute',bottom:0,left:0,width:500,height:300,background:`radial-gradient(ellipse at bottom left, ${C.accentGlow}, transparent 70%)`,pointerEvents:'none' }}/>

      {/* Portrait photo — right side */}
      <motion.div initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} transition={{duration:1.2,ease:[0.16,1,0.3,1],delay:0.2}}
        style={{ position:'absolute',right:'8%',top:0,bottom:0,width:'34%',overflow:'hidden' }}>
        <Img src={PERSON.portrait} alt={PERSON.name} style={{ width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',filter:'saturate(0.6) brightness(0.85)' }}/>
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(to left, transparent 40%, rgba(8,8,8,0.9) 100%)' }}/>
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top, rgba(8,8,8,0.8) 0%, transparent 40%)' }}/>
        <div style={{ position:'absolute',inset:0,border:'none',outline:'none' }}/>
      </motion.div>

      {/* Hero content — left side */}
      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:1,ease:'easeOut',delay:0.1}}
        style={{ position:'absolute',bottom:0,left:0,padding:'0 52px 56px',maxWidth:620,zIndex:10 }}>
        {/* Role badge */}
        <div style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'4px 12px',border:`1px solid ${C.accentDim}`,marginBottom:20,fontFamily:SANS,fontSize:10,letterSpacing:'0.22em',textTransform:'uppercase',color:C.accent }}>
          <Film size={10}/> {PERSON.primaryRole}
        </div>
        {/* Name */}
        <h1 style={{ fontFamily:SERIF,fontSize:'clamp(46px,6vw,72px)',fontWeight:300,lineHeight:0.95,letterSpacing:'-0.02em',color:C.text,margin:'0 0 6px' }}>
          {PERSON.name}
        </h1>
        <div style={{ fontFamily:SERIF,fontStyle:'italic',fontSize:'clamp(20px,2.5vw,30px)',color:'rgba(226,226,226,0.35)',marginBottom:20,letterSpacing:'0.01em' }}>
          {PERSON.originalName}
        </div>
        {/* Meta */}
        <div style={{ display:'flex',flexWrap:'wrap',gap:16,marginBottom:28 }}>
          {[
            {icon:<Calendar size={12}/>, text:`${PERSON.born} — ${PERSON.died} · ${PERSON.age} años`},
            {icon:<MapPin size={12}/>, text:PERSON.birthplace},
            {icon:<Film size={12}/>, text:PERSON.nationality},
          ].map((m,i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,color:C.textSoft,fontFamily:SANS }}>
              <span style={{color:C.accentDim}}>{m.icon}</span> {m.text}
            </div>
          ))}
        </div>
        {/* Community stats */}
        <div style={{ display:'flex',gap:24,marginBottom:28,paddingBottom:24,borderBottom:`1px solid ${C.border}` }}>
          {[
            {num:PERSON.stats.fans.toLocaleString(), label:'Fans en CineVault'},
            {num:PERSON.stats.avgRating.toFixed(1)+'/5', label:'Rating medio'},
            {num:PERSON.stats.totalFilms+' films', label:'Como director'},
          ].map((s,i) => (
            <div key={i}>
              <div style={{ fontFamily:SERIF,fontSize:26,fontWeight:300,color:C.gold,lineHeight:1 }}>{s.num}</div>
              <div style={{ fontFamily:SANS,fontSize:10,letterSpacing:'0.14em',textTransform:'uppercase',color:C.textMuted,marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* Actions */}
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onFollow} style={{ padding:'11px 26px',background:following?C.accentDim:C.accent,color:C.bg,border:'none',fontFamily:SANS,fontSize:11,letterSpacing:'0.18em',textTransform:'uppercase',cursor:'pointer',transition:'all 0.2s',display:'flex',alignItems:'center',gap:7 }}>
            {following?<><Bell size={12}/> Siguiendo</> : <><Bell size={12}/> Seguir</>}
          </button>
          {[Share2,Bookmark].map((Icon,i) => (
            <button key={i} style={{ width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',color:C.textSoft,border:`1px solid ${C.border}`,cursor:'pointer',transition:'all 0.2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.accentDim;(e.currentTarget as HTMLElement).style.color=C.accent;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.color=C.textSoft;}}>
              <Icon size={15} strokeWidth={1.5}/>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── BIO ─────────────────────────────────────────────────────
function Bio() {
  const [expanded, setExpanded] = useState(false);
  const paragraphs = PERSON.bio.split('\n\n');
  const shown = expanded ? paragraphs : [paragraphs[0]];
  return (
    <motion.section initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.8}} style={{marginBottom:64}}>
      <SectionLabel>Biografía</SectionLabel>
      <div style={{ maxWidth:760 }}>
        {shown.map((p,i) => (
          <p key={i} style={{ fontFamily:SERIF,fontSize:20,fontWeight:300,lineHeight:1.8,color:C.textSoft,margin:'0 0 20px' }}>{p}</p>
        ))}
        {paragraphs.length > 1 && (
          <button onClick={()=>setExpanded(v=>!v)} style={{ display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',fontFamily:SANS,fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:C.accent,padding:0 }}>
            {expanded?<><ChevronUp size={13}/> Leer menos</> : <><ChevronDown size={13}/> Leer más</>}
          </button>
        )}
      </div>
    </motion.section>
  );
}

// ─── KNOWN FOR ───────────────────────────────────────────────
function KnownFor() {
  return (
    <motion.section initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.8}} style={{marginBottom:64}}>
      <SectionLabel>Conocido por</SectionLabel>
      <div style={{ display:'flex',gap:12,overflowX:'auto',paddingBottom:8,scrollbarWidth:'none' }}>
        {PERSON.knownFor.map((film,i) => (
          <Link key={i} to={`/film/${film.id}`} style={{ textDecoration:'none',flexShrink:0,width:120 }}>
            <motion.div whileHover={{y:-6}} transition={{duration:0.25}}>
              <div style={{ aspectRatio:'2/3',borderRadius:2,overflow:'hidden',marginBottom:10,position:'relative',boxShadow:'0 8px 24px rgba(0,0,0,0.5)' }}>
                <Img src={film.img} alt={film.title} style={{ width:'100%',height:'100%',objectFit:'cover',filter:'saturate(0.6)',transition:'filter 0.3s' }}/>
                <div style={{ position:'absolute',bottom:0,left:0,right:0,height:'60%',background:'linear-gradient(to top, rgba(8,8,8,0.9), transparent)' }}/>
                <div style={{ position:'absolute',bottom:8,left:0,right:0,textAlign:'center' }}>
                  <div style={{ display:'flex',justifyContent:'center',gap:2 }}>
                    {[1,2,3,4,5].map(s=><span key={s} style={{fontSize:9,color:s<=Math.round(film.rating)?C.gold:'rgba(255,255,255,0.2)'}}>★</span>)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize:12,color:C.text,fontFamily:SANS,lineHeight:1.3,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{film.title}</div>
              <div style={{ fontSize:11,color:C.textSoft,fontFamily:SANS }}>{film.year}</div>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}

// ─── AWARDS ──────────────────────────────────────────────────
function Awards() {
  return (
    <motion.section initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.8}} style={{marginBottom:64}}>
      <SectionLabel>Reconocimientos</SectionLabel>
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        {PERSON.awards.map((a,i) => (
          <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:C.surface,borderLeft:`2px solid ${C.accentDim}` }}>
            <Award size={14} color={C.gold} style={{flexShrink:0}}/>
            <span style={{ fontFamily:SERIF,fontSize:16,color:C.textSoft }}>{a}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── FILMOGRAPHY ROW ─────────────────────────────────────────
function FilmRow({ film, crewRole }: { film:FilmCredit; crewRole?:string }) {
  const [hov, setHov] = useState(false);
  return (
    <Link to={`/film/${film.id}`} style={{ textDecoration:'none' }}>
      <motion.div
        onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{ display:'grid',gridTemplateColumns:'48px 56px 1fr auto',gap:16,alignItems:'center',padding:'16px 0',borderBottom:`1px solid ${C.border}`,cursor:'pointer',background:hov?'rgba(212,175,122,0.03)':'transparent',transition:'background 0.2s' }}>
        {/* Year */}
        <div style={{ fontFamily:SERIF,fontSize:16,color:C.textMuted,textAlign:'right' }}>{film.year}</div>
        {/* Poster */}
        <div style={{ aspectRatio:'2/3',borderRadius:1,overflow:'hidden',border:`1px solid ${hov?C.accentDim:C.border}`,transition:'border-color 0.2s' }}>
          <Img src={film.img} alt={film.title} style={{ width:'100%',height:'100%',objectFit:'cover',filter:'saturate(0.5)' }}/>
        </div>
        {/* Info */}
        <div>
          <div style={{ fontFamily:SERIF,fontSize:20,color:C.text,marginBottom:3,lineHeight:1.2 }}>{film.title}</div>
          <div style={{ fontFamily:SERIF,fontStyle:'italic',fontSize:14,color:C.textMuted,marginBottom:6 }}>{film.originalTitle}</div>
          <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
            {film.genres.map(g=>(
              <span key={g} style={{ fontSize:9,letterSpacing:'0.14em',textTransform:'uppercase',color:C.textSoft,border:`1px solid ${C.border}`,padding:'2px 8px',fontFamily:SANS }}>{g}</span>
            ))}
            {crewRole && <span style={{ fontSize:9,letterSpacing:'0.14em',textTransform:'uppercase',color:C.accent,border:`1px solid ${C.accentDim}`,padding:'2px 8px',fontFamily:SANS }}>{crewRole}</span>}
            {film.secondary && <span style={{ fontSize:9,letterSpacing:'0.14em',textTransform:'uppercase',color:C.textSoft,border:`1px solid ${C.border}`,padding:'2px 8px',fontFamily:SANS }}>{film.role}</span>}
          </div>
        </div>
        {/* Rating + action */}
        <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8 }}>
          <div style={{ fontFamily:SERIF,fontSize:22,fontWeight:300,color:C.gold }}>{film.rating.toFixed(1)}</div>
          <div style={{ fontSize:10,color:C.textMuted,fontFamily:SANS }}>{film.duration}</div>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── FILMOGRAPHY ─────────────────────────────────────────────
const CREW_TABS = ['Director','Guionista','Productor'] as const;
type CrewTab = typeof CREW_TABS[number];
const CREW_KEY:Record<CrewTab,'director'|'writer'|'producer'> = {Director:'director',Guionista:'writer',Productor:'producer'};

function Filmography() {
  const [careerTab, setCareerTab] = useState<'crew'|'actor'>('crew');
  const [crewTab, setCrewTab]     = useState<CrewTab>('Director');
  const [decade, setDecade]       = useState<string>('Todo');

  const crewFilms = PERSON.crew[CREW_KEY[crewTab]];
  const decades = ['Todo','1960s','1970s','1980s'];
  const filterByDecade = (films: FilmCredit[]) =>
    decade === 'Todo' ? films : films.filter(f => f.year >= parseInt(decade) && f.year < parseInt(decade)+10);

  const displayed = careerTab === 'crew' ? filterByDecade(crewFilms) : PERSON.actor;

  return (
    <motion.section initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.8}} style={{marginBottom:64}}>
      <SectionLabel>Filmografía</SectionLabel>

      {/* Career type selector */}
      <div style={{ display:'flex',gap:2,marginBottom:24,borderBottom:`1px solid ${C.border}`,paddingBottom:0 }}>
        {(['crew','actor'] as const).map(tab => (
          <button key={tab} onClick={()=>setCareerTab(tab)} style={{ padding:'10px 24px',background:'none',border:'none',borderBottom:`2px solid ${careerTab===tab?C.accent:'transparent'}`,fontFamily:SANS,fontSize:12,letterSpacing:'0.16em',textTransform:'uppercase',color:careerTab===tab?C.text:C.textSoft,cursor:'pointer',transition:'all 0.2s',marginBottom:-1 }}>
            {tab === 'crew' ? `Crew (${PERSON.crew.director.length})` : `Actor (${PERSON.actor.length})`}
          </button>
        ))}
      </div>

      {/* Crew sub-tabs */}
      <AnimatePresence mode="wait">
        {careerTab === 'crew' && (
          <motion.div key="crew" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
              <div style={{ display:'flex',gap:8 }}>
                {CREW_TABS.map(t => (
                  <button key={t} onClick={()=>setCrewTab(t)} style={{ padding:'6px 16px',background:crewTab===t?C.accentGlow:'transparent',color:crewTab===t?C.accent:C.textSoft,border:`1px solid ${crewTab===t?C.accentDim:C.border}`,fontFamily:SANS,fontSize:10,letterSpacing:'0.14em',textTransform:'uppercase',cursor:'pointer',transition:'all 0.2s' }}>
                    {t} ({PERSON.crew[CREW_KEY[t]].length})
                  </button>
                ))}
              </div>
              {/* Decade filter */}
              <div style={{ display:'flex',gap:6 }}>
                {decades.map(d => (
                  <button key={d} onClick={()=>setDecade(d)} style={{ padding:'4px 12px',background:decade===d?C.elevated:'transparent',color:decade===d?C.text:C.textMuted,border:`1px solid ${decade===d?C.border:'transparent'}`,fontFamily:SANS,fontSize:10,letterSpacing:'0.1em',cursor:'pointer',transition:'all 0.2s' }}>{d}</button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Film list */}
      <AnimatePresence mode="wait">
        <motion.div key={`${careerTab}-${crewTab}-${decade}`} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3}}>
          {displayed.length === 0 ? (
            <div style={{ padding:'40px 0',textAlign:'center',fontFamily:SERIF,fontStyle:'italic',color:C.textMuted,fontSize:18 }}>Sin resultados para esta década.</div>
          ) : (
            displayed.map((film,i) => <FilmRow key={film.id+i} film={film} crewRole={careerTab==='crew'?crewTab:undefined}/>)
          )}
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}

// ─── PAGE ────────────────────────────────────────────────────
export function PersonDetail() {
  const [following, setFollowing] = useState(false);
  useEffect(() => { window.scrollTo(0,0); }, []);
  return (
    <div style={{ background:C.bg,minHeight:'100vh',color:C.text,fontFamily:SANS,overflowX:'hidden' }}>
      <Grain/>
      <Navbar/>
      <div style={{ paddingTop:64 }}>
        <PersonHero following={following} onFollow={()=>setFollowing(v=>!v)}/>
      </div>
      <div style={{ maxWidth:1100,margin:'0 auto',padding:'72px 52px 0' }}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 280px',gap:72 }}>
          <main>
            <Bio/>
            <KnownFor/>
            <Filmography/>
          </main>
          <aside>
            <div style={{ position:'sticky',top:80 }}>
              <Awards/>
              {/* Community block */}
              <div style={{ background:C.surface,border:`1px solid ${C.border}`,padding:24,marginBottom:20 }}>
                <div style={{ fontSize:10,letterSpacing:'0.24em',textTransform:'uppercase',color:C.accent,marginBottom:18,fontFamily:SANS }}>CineVault</div>
                <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                  {[
                    {icon:<Users size={14}/>,label:'Fans',val:PERSON.stats.fans.toLocaleString()},
                    {icon:<Bookmark size={14}/>,label:'En watchlists',val:PERSON.stats.inWatchlists.toLocaleString()},
                    {icon:<Star size={14}/>,label:'Rating medio',val:`${PERSON.stats.avgRating}/5`},
                  ].map((s,i) => (
                    <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8,color:C.textSoft,fontSize:12,fontFamily:SANS }}>{s.icon} {s.label}</div>
                      <div style={{ fontFamily:SERIF,fontSize:18,color:C.text }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <a href="#" style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:C.surface,border:`1px solid ${C.border}`,color:C.textSoft,textDecoration:'none',fontFamily:SANS,fontSize:11,letterSpacing:'0.12em',transition:'border-color 0.2s' }}
                onMouseEnter={e=>(e.currentTarget.style.borderColor=C.accentDim)} onMouseLeave={e=>(e.currentTarget.style.borderColor=C.border)}>
                Ver en Wikipedia <ExternalLink size={12}/>
              </a>
            </div>
          </aside>
        </div>
      </div>
      <footer style={{ borderTop:`1px solid ${C.border}`,padding:'24px 52px',display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:80 }}>
        <Link to="/" style={{ fontFamily:SERIF,fontSize:16,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textMuted,textDecoration:'none' }}>Cine<span style={{color:C.accent}}>Vault</span></Link>
        <div style={{ fontFamily:SERIF,fontStyle:'italic',fontSize:14,color:C.textMuted }}>"Toda gran colección empieza con una."</div>
      </footer>
    </div>
  );
}
