// const bcrypt = require('bcrypt');
// const argon2 = require('argon2');
const crypto = require('crypto');

const { performance } = require('perf_hooks');

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

        // await bcrypt
        // .genSalt(workFactor)
        // .then(salt => {
        //     return bcrypt.hash(input, salt);
        // })
        // .then(hash => {
        //     hashed = hash;
        // })
        // .catch(err => console.error(err.message));

        
        // console.log(sha)

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
                    

                // next
			}
			else break;
		}
    }

    // this failure case will never happen but cover it anyway
    return '0'.repeat(16);
}

// async function bcryptHash(input, workFactor) {
//     const t0 = performance.now();
//     let hashed;
//     await bcrypt
//         .genSalt(workFactor)
//         .then(salt => {
//             return bcrypt.hash(input, salt);
//         })
//         .then(hash => {
//             hashed = hash;
//         })
//         .catch(err => console.error(err.message));
//     const mem = process.memoryUsage().heapUsed / 1024 / 1024;
//     console.log(`Memory used>> right after hashing: ${mem} MB`);
   
//     const t1 = performance.now();
//     console.log(`bcrypt Hash: ${hashed}`);
//     console.log(`Time taken: ${t1 - t0} milliseconds`);
// }

// function cryptoHash(input, algo) {
//     const t0 = performance.now();
//     const hashed = crypto.createHash(algo).update(input).digest('hex');
//     const mem = process.memoryUsage().heapUsed / 1024 / 1024;
//     console.log(`Memory used>> right after hashing: ${mem} MB`);
//     const t1 = performance.now();
//     console.log(`${algo} Hash: ${hashed}`);
//     console.log(`Time taken: ${t1 - t0} milliseconds`);
// }

// async function argonHash(input) {
//     const t0 = performance.now();
//     const hashed = await argon2.hash(input);
//     const mem = process.memoryUsage().heapUsed / 1024 / 1024;
//     console.log(`Memory used>> right after hashing: ${mem} MB`);
//     const t1 = performance.now();
//     console.log(`Argon2 Hash: ${hashed}`);
//     console.log(`Time taken: ${t1 - t0} milliseconds`);
// }

async function main() {
    const input = '6072a8430af380f94edb63b9ceb0835712cf05a0d61206beb8140833e3b7bd34edd067c8542682944f7b3d28a1502ad35be8bd4411446e8d4d945de4e336054d2a0000000000006c07';
    const lgrhex='d68c92f15093ec28228107dce5116432b45cce20549ec73eec1e923c86a69bc9';
    const pubkeyhex='edd0e7558b81272ae052da8debb0da9383f9e7050e60b774d718e4260502e44ac8';

    //add time delay
    stopMemoryUsageMeasurement();
    measureMemoryUsage(1);

    pow_sha512(lgrhex, pubkeyhex, 5)

    // console.log('\nUsing bcrypt (work factor 10):');
    // await bcryptHash(input, 10);

    // console.log('\nUsing Argon2:');
    // await argonHash(input);

    // // Stop measuring memory usage after all operations are done
    // stopMemoryUsageMeasurement();
    
    // // Start measuring memory usage in the background
    // measureMemoryUsage(0.01); // Measure every 1 millisecond

    // console.log('\nUsing SHA-512:');
    // cryptoHash(input, 'sha512');

    // console.log('\nUsing SHA-256:');
    // cryptoHash(input, 'sha256');

    // stopMemoryUsageMeasurement();
    // measureMemoryUsage(0.5);

    // console.log('\nUsing bcrypt (work factor 4):');
    // await bcryptHash(input, 4);

    // stopMemoryUsageMeasurement();
    // measureMemoryUsage(1);
    // console.log('\nUsing bcrypt (work factor 8):');
    // await bcryptHash(input, 8);

    // stopMemoryUsageMeasurement();
    // measureMemoryUsage(10);
    // console.log('\nUsing bcrypt (work factor 10):');
    // await bcryptHash(input, 10);

    // console.log('\nUsing Argon2:');
    // await argonHash(input);

    // Stop measuring memory usage after all operations are done
    stopMemoryUsageMeasurement();
}

main().catch(console.error);
