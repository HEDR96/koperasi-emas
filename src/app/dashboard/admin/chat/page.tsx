"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Search, MessageCircle } from "lucide-react";

const CONVERSATIONS = [
  { id:"C001", name:"Budi Santoso", lastMsg:"Halo, saya ingin tanya soal buyback...", time:"5 mnt", unread:2, online:true },
  { id:"C002", name:"Siti Rahayu", lastMsg:"Kapan saldo saya bisa dicairkan?", time:"30 mnt", unread:1, online:true },
  { id:"C003", name:"Ahmad Fauzi", lastMsg:"Terima kasih, sudah clear!", time:"1 jam", unread:0, online:false },
  { id:"C004", name:"Dewi Kartika", lastMsg:"Oke, saya akan transfer sekarang.", time:"2 jam", unread:0, online:false },
  { id:"C005", name:"Rino Pratama", lastMsg:"Cicilan ke-3 sudah saya bayar.", time:"3 jam", unread:0, online:true },
];

const MOCK_MSGS: Record<string, {from:"admin"|"member"; text:string; time:string}[]> = {
  C001: [
    { from:"member", text:"Halo min, saya ingin tanya soal buyback emas", time:"10:25" },
    { from:"member", text:"Kalau saya mau jual 5g emas, prosesnya bagaimana?", time:"10:26" },
    { from:"admin", text:"Halo Budi! Untuk buyback emas sangat mudah ya", time:"10:28" },
    { from:"admin", text:"Cukup masuk ke menu Buyback di dashboard, pilih jumlah gram, lalu konfirmasi.", time:"10:28" },
    { from:"member", text:"Oh begitu, terima kasih infonya!", time:"10:30" },
  ],
  C002: [
    { from:"member", text:"Kapan saldo saya bisa dicairkan?", time:"09:40" },
    { from:"admin", text:"Halo Siti! Proses pencairan biasanya 1-2 hari kerja ya", time:"09:42" },
  ],
};

export default function ChatPage() {
  const [active, setActive] = useState<string|null>("C001");
  const [messages, setMessages] = useState(MOCK_MSGS);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [active, messages]);

  const sendMsg = () => {
    if (!input.trim() || !active) return;
    const now = new Date().toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" });
    setMessages(m => ({
      ...m,
      [active]: [...(m[active] || []), { from:"admin", text:input.trim(), time:now }],
    }));
    setInput("");
  };

  const filtered = CONVERSATIONS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const activeCon = CONVERSATIONS.find(c=>c.id===active);
  const msgs = active ? (messages[active] || []) : [];

  return (
    <div style={{ display:"flex", height:"calc(100vh - 120px)", gap:0, background:"rgba(8,8,8,0.95)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, overflow:"hidden" }}>
      {/* Sidebar */}
      <div style={{ width:280, borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"16px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"7px 12px" }}>
            <Search style={{ width:13, height:13, color:"rgba(255,255,255,0.3)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari percakapan..."
              style={{ background:"none", border:"none", outline:"none", color:"rgba(255,255,255,0.7)", fontSize:".8rem", width:"100%" }} />
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto" }}>
          {filtered.map(c => (
            <button key={c.id} onClick={() => setActive(c.id)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"12px 14px", border:"none", cursor:"pointer", textAlign:"left", transition:"background .15s",
                background: active===c.id?"rgba(212,175,55,0.07)":"transparent",
                borderLeft: active===c.id?"3px solid #D4AF37":"3px solid transparent" }}>
              <div style={{ position:"relative", flexShrink:0 }}>
                <div className="bg-gold-gradient" style={{ width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".85rem" }}>{c.name[0]}</div>
                {c.online && <div style={{ position:"absolute", bottom:0, right:0, width:9, height:9, background:"#4ade80", borderRadius:"50%", border:"2px solid #0a0a0a" }} />}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                  <span style={{ color:"#fff", fontSize:".83rem", fontWeight:600 }}>{c.name}</span>
                  <span style={{ color:"rgba(255,255,255,0.25)", fontSize:".7rem" }}>{c.time}</span>
                </div>
                <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".76rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.lastMsg}</p>
              </div>
              {c.unread > 0 && (
                <div style={{ width:18, height:18, borderRadius:"50%", background:"#D4AF37", color:"#0a0a0a", fontSize:".65rem", fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{c.unread}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {active && activeCon ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
          {/* Header */}
          <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ position:"relative" }}>
              <div className="bg-gold-gradient" style={{ width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".85rem" }}>{activeCon.name[0]}</div>
              {activeCon.online && <div style={{ position:"absolute", bottom:0, right:0, width:9, height:9, background:"#4ade80", borderRadius:"50%", border:"2px solid #0a0a0a" }} />}
            </div>
            <div>
              <p style={{ color:"#fff", fontWeight:700, fontSize:".88rem" }}>{activeCon.name}</p>
              <p style={{ color: activeCon.online?"#4ade80":"rgba(255,255,255,0.3)", fontSize:".72rem" }}>{activeCon.online?"Online":"Offline"}</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:10 }}>
            <AnimatePresence>
              {msgs.map((msg, i) => (
                <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  style={{ display:"flex", justifyContent: msg.from==="admin"?"flex-end":"flex-start" }}>
                  <div style={{ maxWidth:"70%", background: msg.from==="admin"?"rgba(212,175,55,0.15)":"rgba(255,255,255,0.06)", borderRadius: msg.from==="admin"?"18px 18px 4px 18px":"18px 18px 18px 4px", padding:"10px 14px", border: msg.from==="admin"?"1px solid rgba(212,175,55,0.2)":"1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ color:"rgba(255,255,255,0.85)", fontSize:".83rem", lineHeight:1.5 }}>{msg.text}</p>
                    <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".68rem", marginTop:4, textAlign:"right" }}>{msg.time}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:10 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),sendMsg())}
              placeholder="Ketik pesan..." className="input-gold"
              style={{ flex:1, borderRadius:12, padding:"10px 14px", fontSize:".84rem" }} />
            <button className="btn-gold" onClick={sendMsg}
              style={{ width:44, height:44, borderRadius:12, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Send style={{ width:17, height:17 }} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
          <MessageCircle style={{ width:40, height:40, color:"rgba(255,255,255,0.1)" }} />
          <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".9rem" }}>Pilih percakapan</p>
        </div>
      )}
    </div>
  );
}
