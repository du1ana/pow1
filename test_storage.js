const checkDiskSpace = require('check-disk-space').default


async function main() {

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
    
    }

main().catch(console.error);