const {runBrowser}=require('./gpt56-terra-browser.cjs');
runBrowser(process.argv[2],process.argv[3],process.argv[4],'qwen').catch(e=>{console.error(e.stack);process.exitCode=1;});
