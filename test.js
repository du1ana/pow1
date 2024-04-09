const bcrypt = require('bcrypt');
const { performance } = require('perf_hooks');
const readline = require('readline');

let memoryUsageIntervalId = null;

// Function to periodically measure memory usage
function measureMemoryUsage(interval) {
    memoryUsageIntervalId = setInterval(() => {
        const mem = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`Memory used: ${mem} MB`);
    }, interval);
}

// Function to stop measuring memory usage
function stopMemoryUsageMeasurement() {
    if (memoryUsageIntervalId !== null) {
        clearInterval(memoryUsageIntervalId);
        memoryUsageIntervalId = null;
    }
}

async function pow_bcrypt(lgrhex, pubkeyhex, sevens, workFactor) {
    const t0 = performance.now();
    for (let upto = 0n; upto < 0xFFFFFFFFFFFFFFFFn; upto++) {
        let uptohex = upto.toString(16);
        if (uptohex.length < 16)
            uptohex = '0'.repeat(16 - uptohex.length) + uptohex;

        let buf = Buffer.from(lgrhex + pubkeyhex + uptohex, "hex");

        let hashed;
        await bcrypt
            .genSalt(workFactor)
            .then(salt => {
                return bcrypt.hash(buf, salt);
            })
            .then(hash => {
                hashed = hash.substring(7);
            })
            .catch(err => console.error(err.message));

        let i = 0;
        for (; i < sevens && i < hashed.length; ++i) {
            if (hashed.charCodeAt(i) == 55) {
                if (i >= sevens - 1) {
                    const t1 = performance.now();
                    console.log(`bcrypt: ${hashed}`);
                    console.log(`Time taken: ${t1 - t0} milliseconds`);
                    const mem = process.memoryUsage().heapUsed / 1024 / 1024;
                    console.log(`Memory used: ${mem} MB`);
                    return uptohex;
                }
            } else break;
        }
    }
    // This failure case will never happen but cover it anyway
    return '0'.repeat(16);
}

async function main() {
    const lgrhex = 'd68c92f15093ec28228107dce5116432b45cce20549ec73eec1e923c86a69bc9';
    const pubkeyhex = 'edd0e7558b81272ae052da8debb0da9383f9e7050e60b774d718e4260502e44ac8';

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter workFactor: ', async (workFactor) => {
        // Add time delay
        stopMemoryUsageMeasurement();
        measureMemoryUsage(1000);

        await pow_bcrypt(lgrhex, pubkeyhex, 2, parseInt(workFactor));

        // Stop measuring memory usage after all operations are done
        stopMemoryUsageMeasurement();

        rl.close();
    });
}

main().catch(console.error);