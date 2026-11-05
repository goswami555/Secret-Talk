import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MessageCircle, Link2, ImagePlus, Send, Copy, Plus, LockKeyhole, Trash2, ArrowLeft, Sparkles } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const makeId = () => crypto.randomUUID();
const short = (id) => id.slice(0, 8);
const getRoomFromUrl = () => new URLSearchParams(location.search).get('room');
const getModeFromUrl = () => new URLSearchParams(location.search).get('mode');
const formatTime = (s) => new Date(s).toLocaleString([], {hour:'2-digit', minute:'2-digit', day:'numeric', month:'short'});

export default function App() {
  const [room, setRoom] = useState(getRoomFromUrl());
  const [mode, setMode] = useState(getModeFromUrl() || 'home');
  const [inboxId, setInboxId] = useState(localStorage.getItem('st_inbox') || '');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [connected, setConnected] = useState(false);
  const [myTag] = useState(() => { let t=localStorage.getItem('st_tag'); if(!t){t=makeId();localStorage.setItem('st_tag',t)} return t; });
  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const roomUrl = useMemo(() => room ? `${location.origin}${location.pathname}?mode=chat&room=${room}` : '', [room]);

  useEffect(() => {
    if (!inboxId) { const id=makeId(); localStorage.setItem('st_inbox',id); setInboxId(id); }
  }, []);
  useEffect(() => {
    if (!room || !supabase) { setMessages([]); return; }
    let alive=true;
    const load=async()=>{ const {data,error}=await supabase.from('messages').select('*').eq('room_id',room).order('created_at',{ascending:true}).limit(500); if(error){setNotice(error.message);return} if(alive)setMessages(data||[]); };
    load(); setConnected(true);
    const channel=supabase.channel('room-'+room).on('postgres_changes',{event:'*',schema:'public',table:'messages',filter:`room_id=eq.${room}`},payload=>{
      if(payload.eventType==='INSERT') setMessages(prev=>prev.some(m=>m.id===payload.new.id)?prev:[...prev,payload.new].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)));
      if(payload.eventType==='DELETE') setMessages(prev=>prev.filter(m=>m.id!==payload.old.id));
    }).subscribe();
    return ()=>{alive=false;supabase.removeChannel(channel);setConnected(false)};
  },[room]);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);

  const go = (m,r=null) => { const u=new URL(location.href); u.search=''; if(r)u.searchParams.set('room',r); u.searchParams.set('mode',m); history.pushState({},'',u); setRoom(r);setMode(m);setNotice(''); };
  useEffect(()=>{const pop=()=>{setRoom(getRoomFromUrl());setMode(getModeFromUrl()||'home')};addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop)},[]);
  const copy = async (value) => { try{await navigator.clipboard.writeText(value);setNotice('Link copied! Share it anywhere.')}catch{setNotice(value)} };
  const createRoom = () => { const id=makeId(); go('chat',id); };
  const openInbox = () => go('chat',inboxId);
  const send = async (imageUrl=null) => {
    if(!supabase){setNotice('Connect Supabase first. Follow SETUP.md in the project folder.');return}
    if(!text.trim() && !imageUrl)return;
    setBusy(true);
    const payload={room_id:room, sender_tag:myTag, body:text.trim(), image_url:imageUrl};
    const {error}=await supabase.from('messages').insert(payload);
    if(error)setNotice(error.message); else setText('');
    setBusy(false);
  };
  const upload = async (file) => {
    if(!supabase){setNotice('Connect Supabase first.');return}
    if(!file)return;
    if(file.size>5*1024*1024){setNotice('Please choose an image under 5 MB.');return}
    if(!file.type.startsWith('image/')){setNotice('Only image files are supported.');return}
    setBusy(true);
    const path=`${room}/${makeId()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
    const {error}=await supabase.storage.from('chat-images').upload(path,file,{upsert:false});
    if(error){setNotice(error.message);setBusy(false);return}
    const {data}=supabase.storage.from('chat-images').getPublicUrl(path);
    await send(data.publicUrl); setBusy(false);
  };
  const clearMine = async () => {
    if(!supabase)return;
    if(!confirm('Delete all messages sent from this browser in this room?'))return;
    const {error}=await supabase.from('messages').delete().eq('room_id',room).eq('sender_tag',myTag);
    setNotice(error?'Could not delete messages.':'Your messages from this browser were deleted.');
  };

  if(mode==='chat' && room) return <main className="chat-shell">
    <header className="chat-top"><button className="icon-btn" onClick={()=>go('home')}><ArrowLeft size={19}/></button><div className="avatar">S</div><div className="chat-title"><b>Secret conversation</b><span><i className={connected?'online':'offline'} /> {connected?'Live room':'Connecting…'} · #{short(room)}</span></div><button className="icon-btn" title="Delete your messages" onClick={clearMine}><Trash2 size={18}/></button></header>
    <div className="share-strip"><LockKeyhole size={15}/><span>Anyone with this private link can join this room.</span><button onClick={()=>copy(roomUrl)}><Copy size={14}/> Copy invite</button></div>
    <section className="messages">{messages.length===0?<div className="empty-chat"><div className="empty-icon"><MessageCircle size={28}/></div><h2>Your conversation starts here</h2><p>Share the invite link, then send the first message.</p></div>:messages.map(m=><article key={m.id} className={`bubble ${m.sender_tag===myTag?'mine':'theirs'}`}>{m.image_url&&<a href={m.image_url} target="_blank" rel="noreferrer"><img src={m.image_url} alt="Shared image"/></a>}{m.body&&<p>{m.body}</p>}<time>{formatTime(m.created_at)}{m.sender_tag===myTag?' · You':''}</time></article>)}<div ref={bottomRef}/></section>
    {notice&&<div className="notice">{notice}</div>}
    <form className="composer" onSubmit={e=>{e.preventDefault();send()}}><input ref={fileRef} type="file" accept="image/*" hidden onChange={e=>upload(e.target.files?.[0])}/><button type="button" className="attach" onClick={()=>fileRef.current?.click()} title="Send image"><ImagePlus size={20}/></button><input value={text} onChange={e=>setText(e.target.value)} placeholder="Write an anonymous message…" maxLength={2000}/><button className="send" disabled={busy||!text.trim()}><Send size={18}/></button></form>
    <footer className="chat-foot">Keep it kind. Don’t share sensitive personal information.</footer>
  </main>;

  return <main className="landing">
    <nav className="nav"><div className="brand"><span className="brand-mark"><MessageCircle size={19}/></span> SecretTalk<span className="heart">♥</span></div><span className="nav-note"><LockKeyhole size={14}/> No account needed</span></nav>
    <section className="hero"><div className="eyebrow"><Sparkles size={14}/> A little privacy goes a long way</div><h1>Talk freely.<br/><em>Stay anonymous.</em></h1><p className="hero-copy">A quiet corner of the internet for honest conversations, private rooms and anonymous messages.</p>
    <div className="cards">
      <article className="feature-card"><div className="feature-icon purple"><MessageCircle size={22}/></div><h2>Private room</h2><p>Create a one-of-a-kind link and invite someone to a live conversation.</p><button className="primary" onClick={createRoom}>Create chat room <Plus size={17}/></button></article>
      <article className="feature-card"><div className="feature-icon pink"><Link2 size={22}/></div><h2>Your anonymous inbox</h2><p>Keep one personal link. Anyone with it can send you a message or photo.</p><button className="secondary" onClick={()=>copy(`${location.origin}${location.pathname}?mode=chat&room=${inboxId}`)}>Copy my inbox link <Copy size={16}/></button><button className="text-btn" onClick={openInbox}>Open my inbox <ArrowLeft size={14}/></button></article>
    </div>
    {notice&&<div className="notice landing-notice">{notice}</div>}
    <div className="trust"><span><LockKeyhole size={15}/> No sign-up</span><span><ImagePlus size={15}/> Image sharing</span><span><MessageCircle size={15}/> Live messages</span></div>
    <p className="fineprint">Anonymous to other chat participants, not necessarily to the hosting or network provider. Use a private link only with people you trust.</p>
    </section>
    <footer className="site-foot">SecretTalk <span>·</span> Conversations without the introductions.</footer>
  </main>;
}