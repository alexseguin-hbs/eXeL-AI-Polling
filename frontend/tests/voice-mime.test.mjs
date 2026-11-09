const {
  pickVoiceMime, containerFromMime, voiceErrorKind, VOICE_MIME_CANDIDATES,
} = await import('../lib/voice-mime.ts');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

ok(VOICE_MIME_CANDIDATES[0].includes('webm'), 'prefers webm/opus first');
ok(containerFromMime('audio/webm;codecs=opus') === 'webm', 'webm container');
ok(containerFromMime('audio/mp4') === 'mp4', 'mp4 container');
ok(containerFromMime('audio/aac') === 'mp4', 'aac → mp4');
ok(containerFromMime('audio/ogg;codecs=opus') === 'ogg', 'ogg container');

const safari = pickVoiceMime((t) => t === 'audio/mp4' || t === 'audio/aac');
ok(safari.mimeType === 'audio/mp4' && safari.container === 'mp4', `safari picks mp4 (got ${JSON.stringify(safari)})`);

const none = pickVoiceMime(() => false);
ok(none.mimeType === null && none.container === 'webm', 'fallback when nothing supported');

ok(voiceErrorKind({ name: 'NotAllowedError' }) === 'permission', 'permission kind');
ok(voiceErrorKind(Object.assign(new Error('timeout'), { name: 'TimeoutError' })) === 'timeout', 'timeout kind');
ok(voiceErrorKind(new Error('Failed to fetch')) === 'network', 'network kind');
ok(voiceErrorKind(new Error('empty blob 0 bytes')) === 'empty', 'empty kind');
ok(voiceErrorKind(new Error('MIME not supported')) === 'unsupported', 'unsupported kind');

console.log(`voice-mime: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
