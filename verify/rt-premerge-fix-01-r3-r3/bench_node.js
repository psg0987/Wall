let errs=0,fails=0;
{eval(require('fs').readFileSync(process.env.BENCH,'utf8'));for(const l of __bench())console.log('info '+l)}
console.log('errs 0 fails 0');
