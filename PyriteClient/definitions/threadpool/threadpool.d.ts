

declare class ThreadPool {
    constructor();

    terminateAll();
    run(workerScripts, workerFunction, params);
    runJobs();
    onThreadDone(thread);
    triggerDone(result);
    triggerError(error);
    clearDone();
    done(callback);
    error(callback);
}