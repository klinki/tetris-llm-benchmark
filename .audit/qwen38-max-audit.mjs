// Same canonical oracle, fixture paths and benchmark scoring profile as Terra.
import { runAudit } from './gpt56-terra-audit.mjs';
await runAudit(process.argv[2],process.argv[3],'qwen');
