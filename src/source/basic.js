import { lib } from "noname";

const basicPath = lib.init.getCurrentFileLocation(import.meta.url).split("/");

export const basic = {
    extensionDirectoryPath: basicPath
        .slice(0, basicPath.lastIndexOf("extension") + 2)
        .join("/"),
    resolve(obj) {
        if (typeof obj === "function") return Promise.resolve(obj());
        return Promise.resolve(obj);
    }
};
