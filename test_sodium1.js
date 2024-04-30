const { performance } = require('perf_hooks');
const sodium = require('libsodium-wrappers');

let memoryUsageIntervalId = null;

// Function to periodically measure memory usage
function measureMemoryUsage(interval) {
    memoryUsageIntervalId = setInterval(() => {
        const mem = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`${mem}`);
    }, interval);
}

// Function to stop measuring memory usage
function stopMemoryUsageMeasurement() {
    if (memoryUsageIntervalId !== null) {
        clearInterval(memoryUsageIntervalId);
        memoryUsageIntervalId = null;
    }
}

async function pow_sod(lgrhex, pubkeyhex, sevens) {
    await sodium.ready;
    console.log("sodium ready");
    const t0 = performance.now();
    for (let upto = 0n; upto < 0xFFFFFFFFFFFFFFFFn; upto++) {
        let uptohex = upto.toString(16).padStart(16, '0');

        let buf = Buffer.from(lgrhex + pubkeyhex + uptohex, "hex");

        let sha = sodium.crypto_generichash(64, buf, null, "hex");

        //console.log("sodium sha:", sha);
        let i = 0;
        for (; i < sevens && i < sha.length; ++i) {
            if (sha.charCodeAt(i) == 55) {
                if (i >= sevens - 1) {
                    const t1 = performance.now();
                    console.log(`sha512: ${sha}`);
                    console.log(`Time taken: ${t1 - t0} milliseconds`);
                    const mem = process.memoryUsage().heapUsed / 1024 / 1024;
                    console.log(`Memory used: ${mem} MB`);
                    return uptohex;
                }
            } else break;
        }
    }

    return '0'.repeat(16);
}

async function main() {
    const lgrhex = 'd68c92f15093ec28228107dce5116432b45cce20549ec73eec1e923c86a69bc9';
    const pubkeyhex = 'edd0e7558b81272ae052da8debb0da9383f9e7050e60b774d718e4260502e44ac8';

        // Add time delay
        stopMemoryUsageMeasurement();
        measureMemoryUsage(1000);

        await pow_sod(lgrhex, pubkeyhex, 5, parseInt(workFactor));

        // Stop measuring memory usage after all operations are done
        stopMemoryUsageMeasurement();

        rl.close();
    }

main().catch(console.error);