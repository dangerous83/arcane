'use strict';
const limits = new Map();
const instructions = `You are Arcane Interior Decorations' concise, friendly website assistant. Help visitors explore sculptural GRG, ceilings and partitions, and interior fit-out. Arcane was established in 2004, works across the UAE, and uses specialist casting, installation, coordination and finish inspection. Address: Emaar Business Park, Building 1, Office 530, Sheikh Zayed Road, Dubai. Phone +971 4 570 7248. WhatsApp +971 58 892 3604. Email info@arcane.ae. The portfolio names Wynn Al Marjan Island, Burj Binghatti Jacob & Co Residences, District 01 West, Dubai Harbour Residences, Serenia Living, Dubai Exhibition Centre, Forte Towers, Golf Ville, Golf Place, Murooj Al Furjan, The Green View, Binghatti Orchid, Binghatti Dusk, J One Tower, EMPOWER Headquarters, Boulevard Heights and Sheikh Zayed Showroom. Generated project and service hero images are illustrative concepts. Do not claim they are completed-work photographs. Never invent pricing, timelines, availability, credentials or completion status. For quotations invite visitors to use the project enquiry form or WhatsApp. Ask one useful project question at a time. Do not say you have sent, stored or booked anything; you have no external tools. Answer only within your role helping visitors with Arcane and interior projects.`;
module.exports = async function chat(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const key = process.env.OPENAI_API_KEY;
  if (req.method === 'GET') return res.status(200).json({ configured: Boolean(key) });
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed.' }); }
  if (req.headers.origin) {
    try { if (new URL(req.headers.origin).host !== req.headers.host) return res.status(403).json({ error: 'Invalid origin.' }); }
    catch { return res.status(403).json({ error: 'Invalid origin.' }); }
  }
  if (!key) return res.status(503).json({ error: 'AI replies are being connected. Please contact our team on WhatsApp.' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({ error: 'Invalid request.' }); }
  const messages = body?.messages;
  if (!Array.isArray(messages) || !messages.length || messages.length > 12 || messages.some(m => !m || !['user','assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 2000) || messages.at(-1).role !== 'user') return res.status(400).json({ error: 'Please send a short project question.' });
  if (messages.reduce((sum,m)=>sum+m.content.length,0) > 10000) return res.status(400).json({ error: 'Please start a new conversation.' });
  const now=Date.now();
  for(const [id, bucket] of limits) if(now-bucket.start>60000) limits.delete(id);
  if(limits.size>1000) limits.clear();
  const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0];
  let bucket=limits.get(ip);if(!bucket){bucket={start:now,count:0};limits.set(ip,bucket);}
  if(++bucket.count>8){res.setHeader('Retry-After','60');return res.status(429).json({error:'Please wait a minute before asking another question.'});}
  try {
    const upstream=await fetch('https://api.openai.com/v1/responses', {method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.ARCANE_AI_MODEL||'gpt-5-mini',instructions,input:messages.map(m=>({role:m.role,content:m.content})),max_output_tokens:1200,reasoning:{effort:'minimal'},store:false}),signal:AbortSignal.timeout(25000)});
    if(!upstream.ok)return res.status(502).json({error:'Our assistant is unavailable right now. Please contact our team on WhatsApp.'});
    const data=await upstream.json();
    const reply=(data.output||[]).flatMap(item=>item.content||[]).filter(part=>part.type==='output_text').map(part=>part.text).join('\n').trim();
    if(!reply)return res.status(502).json({error:'Please try a shorter question or contact our team on WhatsApp.'});
    return res.status(200).json({reply});
  }catch{return res.status(502).json({error:'Our assistant is unavailable right now. Please contact our team on WhatsApp.'});}
};
