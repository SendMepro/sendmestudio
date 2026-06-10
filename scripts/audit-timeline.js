const s = require('../data/whatsapp-store.json');

// AI messages sorted by timestamp
const aiMsgs = s.messages.filter(m => m.metadata?.generatedByAI).sort((a,b) => parseInt(a.timestamp) - parseInt(b.timestamp));
console.log('=== AI messages sorted by time ===');
aiMsgs.forEach(m => {
  const d = new Date(parseInt(m.timestamp) * 1000);
  console.log(d.toISOString(), `conv:${String(m.conversationId).slice(-4)}`, `"${(m.content||'').slice(0,50)}"`);
});

// When was the last outbound manual (non-AI) vs AI?
const allOutbound = s.messages.filter(m => m.direction === 'outbound').sort((a,b) => parseInt(a.timestamp) - parseInt(b.timestamp));
console.log('\n=== All outbound messages sorted ===');
allOutbound.forEach(m => {
  const d = new Date(parseInt(m.timestamp) * 1000);
  const isAI = m.metadata?.generatedByAI ? ' [AI]' : '';
  console.log(d.toISOString(), m.status, `"${(m.content||'').slice(0,50)}"${isAI}`);
});

// Check autoReplyEnabled timeline - we can't know when it was changed, only current state
console.log('\n=== Conversations ===');
s.conversations.forEach(c => {
  console.log(`${String(c.phone).slice(-4)}: autoReplyEnabled=${c.autoReplyEnabled}, mode=${c.mode || 'N/A'}`);
});
