import * as path from "path";
import * as fs from "fs";

const { ipcMain,app } = require('electron');
const {exec} = require("child_process");

// 拉取最新代码
export function gitPull(){
  ipcMain.on('gitPull', (event, arg) => {
    let formInline = JSON.parse(arg)
    // 在这里可以执行相应的操作，并向渲染进程发送回复
    // 执行Shell命令
    exec(`cd ${formInline.file} && git pull`, (error, stdout, stderr) => {
      if (error) {
        event.reply('command-result', { error: error.message });
        return;
      }
      if (stderr) {
        event.reply('command-result', { error: stderr });
        return;
      }
      event.reply('command-result', { result: stdout });
    });
    event.reply('reply-from-main', arg);
  });

}

// 提交代码
export function gitCommit(){
  // 监听来自渲染进程的消息
  ipcMain.on('gitCommit', (event, arg) => {
    let formInline = JSON.parse(arg)
    // 在这里可以执行相应的操作，并向渲染进程发送回复
    // 执行Shell命令
    //stdout（标准输出流） 用于输出正常的程序输出。
    // stderr（标准错误流） 用于输出错误信息和警告，通常用于指示程序执行时的问题。
    exec(`cd ${formInline.file} && git add . && git commit -m ${formInline.text} && git push`, (error, stdout, stderr) => {
      if (error) {
        event.reply('command-result', { error: error.message });
        return;
      }
      if (stderr) {
        event.reply('command-result', { error: stderr });
        return;
      }
      event.reply('command-result', { result: stdout });
    });
    event.reply('reply-from-main', arg);
  });

}

// 从本地读取对象
function getObjectFromCache() {
  const filePath = path.join(app.getPath('userData'), 'cache.json');
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading file:', err);
    return null;
  }
}

// 获取本地缓存对象
export function getLocalStorage(){
  // 监听来自渲染进程的请求，发送本地对象到渲染进程
  ipcMain.on('get-object', (event) => {
    const obj = getObjectFromCache();
    event.reply('send-object', obj);
  });
}
// 保存对象到本地
export function saveObjectToCache() {

  // 监听来自渲染进程的消息，保存对象到本地
  ipcMain.on('save-object', (event, obj) => {
    const filePath = path.join(app.getPath('userData'), 'cache.json');
    fs.writeFileSync(filePath, obj);
  });
}
