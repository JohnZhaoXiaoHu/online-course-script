const fs = require("fs");
const p = require("path");
const dayjs = require("dayjs");
const { app } = require("electron");
const{ info } = require("electron-log");
 

export type LoggerLevel = "info" | "error" | "warn" | "success" | "notify" | "task";
export interface Logger {
    info(...msg: any[]): void;
    error(...msg: any[]): void;
    warn(...msg: any[]): void;
    success(...msg: any[]): void;
    task(description: string, handler: () => Promise<any>): Promise<any>;
    log(level: LoggerLevel, ...msg: any[]): void;
}

export function logger(eventName: string): Logger {
    return {
        info(...msg: any[]): void {
            return log(eventName, "info", msg);
        },
        error(...msg: any[]): void {
            return log(eventName, "error", msg);
        },
        warn(...msg: any[]): void {
            return log(eventName, "warn", msg);
        },
        success(...msg: any[]): void {
            return log(eventName, "success", msg);
        },
        log(level: LoggerLevel, ...msg: any[]): void {
            info(level, msg);

            return log(eventName, level, msg);
        },
        task(description: string, handler: () => Promise<any>): Promise<any> {
            return new Promise(async (resolve, reject) => {
                try {
                    const t = Date.now();
                    log("system", "task", description);
                    resolve(await handler());
                    log("system", "task", description + "成功,耗时:" + (Date.now() - t));
                } catch (err) {
                    reject(err);
                }
            });
        },
    };
}

export function getLogsFolderName() {
    return new Date().toLocaleDateString("zh-CN").split("/").join("-");
}

// 添加文件夹
export function mkdirs(url: string): void {
    if (!fs.existsSync(url)) {
        mkdirs(p.resolve(url, "../"));
        fs.mkdirSync(url);
    }
}

/**
 * 输出信息到文件中
 * @param eventName 事件名称
 * @param args 参数
 */
export function log(eventName: string, level: LoggerLevel, ...msg: any[]) {
    // console.log({level,eventName,msg});

    const path = app.getPath("logs");
    const data = {
        name: eventName,
        localTime: dayjs().format("YYYY-MM-DD HH-mm-ss"),
        data: msg,
    };
    // 保存的文件夹
    const folder = p.resolve(p.join(path, `/${getLogsFolderName()}/${eventName}/`));

    // 文件
    const file = p.resolve(folder, `${level}.json`);
    // 如果有则追加到集合中，否则创建集合
    if (fs.existsSync(file)) {
        const logsJSON = JSON.parse(fs.readFileSync(file).toString());
        logsJSON.push(data);
        fs.writeFileSync(file, JSON.stringify(logsJSON, null, 4));
    } else {
        mkdirs(folder);
        fs.writeFileSync(file, JSON.stringify([data], null, 4));
    }
}
