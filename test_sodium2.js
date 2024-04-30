const sodium = require('libsodium-wrappers-sumo');
const checkDiskSpace = require('check-disk-space').default

const { performance } = require('perf_hooks');
let memoryUsageIntervalId = null;

// Function to periodically measure memory usage
function measureMemoryUsage(interval) {
    memoryUsageIntervalId = setInterval(() => {
        const mem = process.memoryUsage().heapUsed / 1024 / 1024;
        //console.log(`${mem}`);
    }, interval);
}

// Function to stop measuring memory usage
function stopMemoryUsageMeasurement() {
    if (memoryUsageIntervalId !== null) {
        clearInterval(memoryUsageIntervalId);
        memoryUsageIntervalId = null;
    }
}

function stopMemoryUsageMeasurement() {
    if (memoryUsageIntervalId !== null) {
        clearInterval(memoryUsageIntervalId);
        memoryUsageIntervalId = null;
    }
}


async function pow_sod(lgrhex, pubkeyhex, sevens) {
    await sodium.ready;
    const t0 = performance.now();
    for (let upto = 0n; upto < 0xFFFFFFFFFFFFFFFFn; upto++) {
        let uptohex = upto.toString(16).padStart(16, '0');

        let buf = Buffer.from(lgrhex + pubkeyhex + uptohex, "hex").toString("hex");
        const salt = Uint8Array.from(lgrhex).slice(0, sodium.crypto_pwhash_SALTBYTES);

        memLimit = 682 * 1024 * 1024;
        opsLimit = sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE >>> 0;

        const startTime = performance.now();

        //let hashedBuffer = Buffer.alloc(sodium.crypto_pwhash_STRBYTES >>> 0);
        let hashedBuffer = sodium.crypto_pwhash(
            sodium.crypto_pwhash_STRBYTES >>> 0,
            buf,
            salt,
            opsLimit,
            memLimit,
            sodium.crypto_pwhash_ALG_DEFAULT
        );

        let sha = hashedBuffer.toString('hex');

        const endTime = performance.now();

        // Calculate the time taken
        const timeTaken = endTime - startTime;
        console.log("time taken:", timeTaken)

        let i = 0;
        for (; i < sevens && i < sha.length; ++i) {
            if (sha.charCodeAt(i) == 55) {
                if (i >= sevens - 1) {
                    const t1 = performance.now();
                    console.log(`hash: ${sha}`);
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

async function countsevens(lgrhex, pubkeyhex, uptohex)
{
    console.log("c7 lgrhex:",lgrhex)
    console.log("c7 pubkeyhex:",pubkeyhex)
    console.log("c7 uptohex:",uptohex)

    let buf = Buffer.from(lgrhex + pubkeyhex + uptohex, "hex").toString("hex");
    const salt = Uint8Array.from(lgrhex).slice(0, sodium.crypto_pwhash_SALTBYTES);

    memLimit = (sodium.crypto_pwhash_MEMLIMIT_MAX >>> 0) * 0.99 >>> 0;
    opsLimit = sodium.crypto_pwhash_OPSLIMIT_MIN >>> 0;

    //let hashedBuffer = Buffer.alloc(sodium.crypto_pwhash_STRBYTES >>> 0);
    let hashedBuffer = sodium.crypto_pwhash(
        sodium.crypto_pwhash_STRBYTES >>> 0,
        buf,
        salt,
        opsLimit,
        memLimit,
        sodium.crypto_pwhash_ALG_DEFAULT
    );
    let sha = hashedBuffer.toString('hex');

    console.log("c7 hashed:", sha);

    for (let i = 0; i < sha.length; ++i)
    {
        if (sha.charCodeAt(i) != 55){
            console.log("c7 i:", i);
            return i+1;
        }
    }
    return sha.length;
}

async function main() {
    const lgrhex = 'd68c92f15093ec28228107dce5116432b45cce20549ec73eec1e923c86a69bc9';
    const pubkeyhex = 'edd0e7558b81272ae052da8debb0da9383f9e7050e60b774d718e4260502e44ac8';
    checkDiskSpace('/').then((diskSpace) => {
        let free= diskSpace.free;
        let size= diskSpace.size;
        console.log("free:",free)
        console.log("size:",size)
        let freeGB= diskSpace.free/(1024*1024*1024);
        let sizeGB= diskSpace.size/(1024*1024*1024);
        console.log("freeGB:",freeGB)
        console.log("sizeGB:",sizeGB)
    })

        // Add time delay
        stopMemoryUsageMeasurement();
        measureMemoryUsage(10);

        let uptohex = await pow_sod(lgrhex, pubkeyhex, 3);
        console.log(uptohex)


        countsevens(lgrhex, pubkeyhex, uptohex)
        countsevens(lgrhex, pubkeyhex, uptohex)
        countsevens(lgrhex, pubkeyhex, uptohex)

        


        // Stop measuring memory usage after all operations are done
        stopMemoryUsageMeasurement();
    }

main().catch(console.error);