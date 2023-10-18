const log4js = require("log4js");
log4js.configure({
    replaceConsole: true,
    appenders: {
        log: {
            type: "DateFile",
            level: "DEBUG",
            filename: "logs/log",
            pattern: "yyyy-MM-dd.log",
            maxLogSize: 1024 * 1000,
            backups: 180,
            alwaysIncludePattern: true,
        },
        err: {
            type: "DateFile",
            level: "DEBUG",
            filename: "logs/error",
            pattern: "yyyy-MM-dd.log",
            maxLogSize: 1024 * 1000,
            backups: 3,
            alwaysIncludePattern: true,
        },
    },
    categories: {
        default: {
            appenders: ["log"],
            level: "debug",
        },
        err: {
            appenders: ["err"],
            level: "error",
        },
        sql: {
            appenders: ["log"],
            level: "debug",
        },
        input: {
            appenders: ["log"],
            level: "debug",
        },
        output: {
            appenders: ["log"],
            level: "debug",
        },
    },
});
const log = (data) => {
    let logger = log4js.getLogger();
    logger.info(data);
};
const logSql = (data) => {
    let logger = log4js.getLogger("sql");
    logger.info(data);
};
const logInput = (data) => {
    let logger = log4js.getLogger("input");
    logger.info(data);
};
const logOutput = (data) => {
    let logger = log4js.getLogger("sql");
    logger.info(data);
};
const logError = (data) => {
    let logger = log4js.getLogger("error");
    logger.error(data);
};
module.exports = {
    log,
    logSql,
    logInput,
    logOutput,
    logError,
};