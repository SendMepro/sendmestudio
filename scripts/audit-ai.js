const s = require('../data/whatsapp-store.json');
// Find all AI-generated messages
const aiMsgs = s.messages.filter(m => m.metadata && m.metadata.generatedByAI);
console.log('=== AI-generated messages found:', aiMsgs.length, '===');
aiMsgs.forEach((m, i) => {
  console.log(`\n[${i+1}] ${m.direction} | ${m.status} | waMessageId: ${m.waMessageId || 'NO-TIENE'}`);
  console.log(`  phone: ***${String(m.phone).slice(-4)}`);
  console.log(`  content: "${(m.content || '').slice(0, 80)}"`);
  console.log(`  timestamp: ${m.timestamp} (${new Date(parseInt(m.timestamp)*1000).toISOString()})`);
  console.log(`  metadata: ${JSON.stringify(m.metadata, null, 4)}`);
  console.log(`  raw: ${JSON.stringify(m.raw || {}).slice(0, 200)}`);
});

// Also show the inbound messages in the same conversation for context
console.log('\n\n=== Inbound messages in conv 56920103822 ===');
const convMsgs = s.messages.filter(m => m.conversationId === '56920103822');
convMsgs.forEach((m, i) => {
  const isAI = m.metadata && m.metadata.generatedByAI;
  console.log(`[${i+1}] ${m.direction} | ${m.status} | ${m.waMessageId ? 'wa:'+String(m.waMessageId).slice(0,20) : 'no-wa-id'}${isAI ? ' [AI]' : ''} | "${(m.content||'').slice(0,60)}"`);
  if (m.metadata && !m.metadata.generatedByAI) {
    console.log(`      metadata: ${JSON.stringify(m.metadata).slice(0, 150)}`);
  }
});

// Show what generatedByAI looks like in the store
const rawAi = aiMsgs[0];
console.log('\n\n=== Full raw metadata of first AI message ===');
console.log(JSON.stringify(rawAi.metadata, null, 2));
console.log('\n=== Full raw object ===');
console.log(JSON.stringify(rawAi, null, 2));
