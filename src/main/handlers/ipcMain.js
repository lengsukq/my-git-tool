import * as path from "path";
import * as fs from "fs";

const {ipcMain, app} = require('electron');
const {exec} = require("child_process");
const {Client} = require('ssh2');

// 执行Shell命令并返回结果
export function executeShellCommand() {
  ipcMain.on('executeShellCommand', (event, arg) => {
    let commandInfo = arg
    commandInfo.command = commandInfo.command.replace(/\n/g, '');
    console.log('executeShellCommand', commandInfo);

    // command = {fn:xx,command:xx,isMessage:xx}
    // 在这里可以执行相应的操作，并向渲染进程发送回复
    // 执行Shell命令
    exec(commandInfo.command, (error, stdout, stderr) => {
      const reply = commandInfo.isMessage ? 'command-result': 'command-noMsg';
      if (error) {
        event.reply(reply, {error: error.message});
        return;
      }
      if (stderr) {
        event.reply(reply, {error: stderr});
        return;
      }
      event.reply(reply, {result: stdout,fn:commandInfo.fn});
    });
    // event.reply('reply-from-main', arg);
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

// 从本地读取对象
function getSSHCache() {
  try {
    const filePath = path.join(app.getPath('userData'), 'SSHCache.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading file:', err);
    return null;
  }
}

export function getLocalStorageSSH() {
  // 监听来自渲染进程的请求，发送本地对象到渲染进程
  ipcMain.on('getSSHCache', (event) => {
    const obj = getSSHCache();
    event.reply('sendSSHCache', obj);
  });
}

export function saveSSHToCache() {
  try {
    // 监听来自渲染进程的消息，保存对象到本地
    ipcMain.on('saveSSHCache', (event, obj) => {
      const filePath = path.join(app.getPath('userData'), 'SSHCache.json');
      fs.writeFileSync(filePath, obj);
    });
  }catch (err) {
    console.error('Error reading file:', err);
  }

}

// 获取本地缓存对象
export function getLocalStorage() {
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
export function SSHAct() {
  console.log('formSSH1')

  // 监听来自渲染进程的消息
  ipcMain.on('SSHAct', (event, arg) => {
    let formSSH = JSON.parse(arg)
// 创建 SSH 客户端实例
    const conn = new Client();

// 定义连接选项
    const connOptions = {
      host: formSSH.sshUrl.split(":")[0],
      port: formSSH.sshUrl.split(":")[1],
      username: formSSH.sshName,
      password: formSSH.sshPassword // 替换为实际服务器密码
    };

// 连接到服务器
    conn.on('ready', () => {
      console.log('SSH connection established');

      // 在连接准备好后执行远程命令
      conn.exec(`${formSSH.sshShell}`, (err, stream) => {
        if (err) throw err;

        stream.on('data', data => {
          event.reply('command-result', {result: data.toString()});
          console.log('Command Output:', data.toString());
        });

        stream.on('close', () => {
          console.log('Stream closed');

          conn.end();
        });
      });
    });

    conn.on('error', err => {
      event.reply('command-result', {result: err});
      console.error('SSH connection error:', err);
    });

    // 发起连接
    conn.connect(connOptions);
  });
}
