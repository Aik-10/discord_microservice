import os from 'node:os';
import { isDev } from './isDev'

const checkMemoryUsage = () => {
    if (!isDev) return;

    const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const totalMemory = os.totalmem() / 1024 / 1024;
    console.log(`Memory Usage: ${usedMemory.toFixed(4)} MB / ${totalMemory} MB`);
};
setInterval(checkMemoryUsage, 10000);