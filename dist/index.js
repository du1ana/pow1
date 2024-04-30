/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 718:
/***/ ((module) => {

"use strict";
module.exports = require("node:child_process");

/***/ }),

/***/ 977:
/***/ ((module) => {

"use strict";
module.exports = require("node:fs/promises");

/***/ }),

/***/ 612:
/***/ ((module) => {

"use strict";
module.exports = require("node:os");

/***/ }),

/***/ 411:
/***/ ((module) => {

"use strict";
module.exports = require("node:path");

/***/ }),

/***/ 742:
/***/ ((module) => {

"use strict";
module.exports = require("node:process");

/***/ }),

/***/ 261:
/***/ ((module) => {

"use strict";
module.exports = require("node:util");

/***/ }),

/***/ 638:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";
var __webpack_unused_export__;


__webpack_unused_export__ = ({ value: true });

var node_child_process = __nccwpck_require__(718);
var promises = __nccwpck_require__(977);
var node_os = __nccwpck_require__(612);
var node_path = __nccwpck_require__(411);
var node_process = __nccwpck_require__(742);
var node_util = __nccwpck_require__(261);

class InvalidPathError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidPathError';
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, InvalidPathError.prototype);
    }
}

class NoMatchError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NoMatchError';
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, NoMatchError.prototype);
    }
}

/**
 * Tells if directory exists
 *
 * @param directoryPath - The file/folder path
 * @param dependencies - Dependencies container
 */
async function isDirectoryExisting(directoryPath, dependencies) {
    try {
        await dependencies.fsAccess(directoryPath);
        return Promise.resolve(true);
    }
    catch (error) {
        return Promise.resolve(false);
    }
}

/**
 * Get the first existing parent path
 *
 * @param directoryPath - The file/folder path from where we want to know disk space
 * @param dependencies - Dependencies container
 */
async function getFirstExistingParentPath(directoryPath, dependencies) {
    let parentDirectoryPath = directoryPath;
    let parentDirectoryFound = await isDirectoryExisting(parentDirectoryPath, dependencies);
    while (!parentDirectoryFound) {
        parentDirectoryPath = dependencies.pathNormalize(parentDirectoryPath + '/..');
        parentDirectoryFound = await isDirectoryExisting(parentDirectoryPath, dependencies);
    }
    return parentDirectoryPath;
}

/**
 * Tell if PowerShell 3 is available based on Windows version
 *
 * Note: 6.* is Windows 7
 * Note: PowerShell 3 is natively available since Windows 8
 *
 * @param dependencies - Dependencies Injection Container
 */
async function hasPowerShell3(dependencies) {
    const major = parseInt(dependencies.release.split('.')[0], 10);
    if (major <= 6) {
        return false;
    }
    try {
        await dependencies.cpExecFile('where', ['powershell'], { windowsHide: true });
        return true;
    }
    catch (error) {
        return false;
    }
}

/**
 * Check disk space
 *
 * @param directoryPath - The file/folder path from where we want to know disk space
 * @param dependencies - Dependencies container
 */
function checkDiskSpace(directoryPath, dependencies = {
    platform: node_process.platform,
    release: node_os.release(),
    fsAccess: promises.access,
    pathNormalize: node_path.normalize,
    pathSep: node_path.sep,
    cpExecFile: node_util.promisify(node_child_process.execFile),
}) {
    // Note: This function contains other functions in order
    //       to wrap them in a common context and make unit tests easier
    /**
     * Maps command output to a normalized object {diskPath, free, size}
     *
     * @param stdout - The command output
     * @param filter - To filter drives (only used for win32)
     * @param mapping - Map between column index and normalized column name
     * @param coefficient - The size coefficient to get bytes instead of kB
     */
    function mapOutput(stdout, filter, mapping, coefficient) {
        const parsed = stdout
            .split('\n') // Split lines
            .map(line => line.trim()) // Trim all lines
            .filter(line => line.length !== 0) // Remove empty lines
            .slice(1) // Remove header
            .map(line => line.split(/\s+(?=[\d/])/)); // Split on spaces to get columns
        const filtered = parsed.filter(filter);
        if (filtered.length === 0) {
            throw new NoMatchError();
        }
        const diskData = filtered[0];
        return {
            diskPath: diskData[mapping.diskPath],
            free: parseInt(diskData[mapping.free], 10) * coefficient,
            size: parseInt(diskData[mapping.size], 10) * coefficient,
        };
    }
    /**
     * Run the command and do common things between win32 and unix
     *
     * @param cmd - The command to execute
     * @param filter - To filter drives (only used for win32)
     * @param mapping - Map between column index and normalized column name
     * @param coefficient - The size coefficient to get bytes instead of kB
     */
    async function check(cmd, filter, mapping, coefficient = 1) {
        const [file, ...args] = cmd;
        /* istanbul ignore if */
        if (file === undefined) {
            return Promise.reject(new Error('cmd must contain at least one item'));
        }
        try {
            const { stdout } = await dependencies.cpExecFile(file, args, { windowsHide: true });
            return mapOutput(stdout, filter, mapping, coefficient);
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    /**
     * Build the check call for win32
     *
     * @param directoryPath - The file/folder path from where we want to know disk space
     */
    async function checkWin32(directoryPath) {
        if (directoryPath.charAt(1) !== ':') {
            return Promise.reject(new InvalidPathError(`The following path is invalid (should be X:\\...): ${directoryPath}`));
        }
        const powershellCmd = [
            'powershell',
            'Get-CimInstance -ClassName Win32_LogicalDisk | Select-Object Caption, FreeSpace, Size',
        ];
        const wmicCmd = [
            'wmic',
            'logicaldisk',
            'get',
            'size,freespace,caption',
        ];
        const cmd = await hasPowerShell3(dependencies) ? powershellCmd : wmicCmd;
        return check(cmd, driveData => {
            // Only get the drive which match the path
            const driveLetter = driveData[0];
            return directoryPath.toUpperCase().startsWith(driveLetter.toUpperCase());
        }, {
            diskPath: 0,
            free: 1,
            size: 2,
        });
    }
    /**
     * Build the check call for unix
     *
     * @param directoryPath - The file/folder path from where we want to know disk space
     */
    async function checkUnix(directoryPath) {
        if (!dependencies.pathNormalize(directoryPath).startsWith(dependencies.pathSep)) {
            return Promise.reject(new InvalidPathError(`The following path is invalid (should start by ${dependencies.pathSep}): ${directoryPath}`));
        }
        const pathToCheck = await getFirstExistingParentPath(directoryPath, dependencies);
        return check([
            'df',
            '-Pk',
            '--',
            pathToCheck,
        ], () => true, // We should only get one line, so we did not need to filter
        {
            diskPath: 5,
            free: 3,
            size: 1,
        }, 1024);
    }
    // Call the right check depending on the OS
    if (dependencies.platform === 'win32') {
        return checkWin32(directoryPath);
    }
    return checkUnix(directoryPath);
}

__webpack_unused_export__ = InvalidPathError;
__webpack_unused_export__ = NoMatchError;
exports.ZP = checkDiskSpace;
__webpack_unused_export__ = getFirstExistingParentPath;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const checkDiskSpace = (__nccwpck_require__(638)/* ["default"] */ .ZP)


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
})();

module.exports = __webpack_exports__;
/******/ })()
;