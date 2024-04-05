const crypto = require('crypto');

const { performance } = require('perf_hooks');

let memoryUsageIntervalId = null;

function measureMemoryUsage(interval) {
    memoryUsageIntervalId = setInterval(() => {
        const mem = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`Memory used: ${mem} MB`);
    }, interval);
}

function stopMemoryUsageMeasurement() {
    if (memoryUsageIntervalId !== null) {
        clearInterval(memoryUsageIntervalId);
        memoryUsageIntervalId = null;
    }
}

async function pow_sha512(lgrhex, pubkeyhex, sevens)
{
    const t0 = performance.now();
	for(let upto = 0n; upto < 0xFFFFFFFFFFFFFFFFn ; upto++)
	{

		let uptohex = upto.toString(16);
        if (uptohex.length < 16)
			uptohex = '0'.repeat(16 - uptohex.length) + uptohex;
 
		let buf = Buffer.from(lgrhex + pubkeyhex + uptohex, "hex");

		let sha = crypto.createHash('sha512').update(buf).digest('hex');

		let i = 0;
		for (; i < sevens && i < sha.length; ++i)
		{
			if (sha.charCodeAt(i) == 55)
			{
				if (i >= sevens - 1){
                    const t1 = performance.now();
                    console.log(`sha512: ${sha}`);
                    console.log(`Time taken: ${t1 - t0} milliseconds`);
                    const mem = process.memoryUsage().heapUsed / 1024 / 1024;
                    console.log(`Memory used: ${mem} MB`);
                    return uptohex;
                }
			}
			else break;
		}
    }

    return '0'.repeat(16);
}

async function main() {
    const lgrhex='d68c92f15093ec28228107dce5116432b45cce20549ec73eec1e923c86a69bc9';
    const pubkeyhex='edd0e7558b81272ae052da8debb0da9383f9e7050e60b774d718e4260502e44ac8';

    stopMemoryUsageMeasurement();
    measureMemoryUsage(1);

    pow_sha512(lgrhex, pubkeyhex, 5)

    stopMemoryUsageMeasurement();
}

main().catch(console.error);
