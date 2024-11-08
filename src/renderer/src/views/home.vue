<template>
  <el-card class="box-card">
    <el-form :model="formInline" class="">
      <el-form-item label="项目别名">
        <el-input v-model="formInline.name" placeholder="" clearable/>
      </el-form-item>
      <el-form-item label="本地目录">
        <el-input v-model="formInline.file" placeholder="" clearable/>
      </el-form-item>
      <el-form-item label="仓库地址">
        <el-input v-model="formInline.url" placeholder="" clearable/>
      </el-form-item>
      <el-form-item label="提交描述">
        <el-input v-model="formInline.text" placeholder="" type="textarea" show-word-limit clearable/>
      </el-form-item>
      <el-form-item label="远程命令">
        <el-switch v-model="formInline.isSSH"></el-switch>
        <el-button type="primary" class="mgl12" v-if="formInline.isSSH" @click="SSHAct">执行远程</el-button>
      </el-form-item>
      <el-collapse v-model="fromSSH.isShow" class="mgb12" v-if="formInline.isSSH" accordion>
        <el-collapse-item title="远程配置" name="ssh">
          <el-form :model="fromSSH" class="">
            <el-form-item label="远程地址">
              <el-input v-model="fromSSH.sshUrl" placeholder="" show-word-limit clearable/>
            </el-form-item>
            <el-form-item label="连接用户">
              <el-input v-model="fromSSH.sshName" placeholder="" show-word-limit clearable/>
            </el-form-item>
            <el-form-item label="连接密码">
              <el-input v-model="fromSSH.sshPassword" placeholder="" type="password" show-word-limit clearable/>
            </el-form-item>
            <el-form-item label="执行命令">
              <el-input v-model="fromSSH.sshShell" placeholder="" type="textarea" show-word-limit clearable/>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
      <el-form-item>
        <el-button type="primary" @click="executeShellCommand('gitCommit', true)">提交代码</el-button>
        <el-button @click="executeShellCommand('gitPush', true)">推送代码</el-button>
        <el-button @click="executeShellCommand('gitPull', true)">更新代码</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="executeShellCommand('setNewUrl', true)">更新仓库地址</el-button>
        <el-button @click="executeShellCommand('getTheUrl', true)">获取仓库地址</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="saveToCache">存到缓存</el-button>
        <el-button @click="getCache">获取缓存</el-button>
        <el-button @click="restCache">清空缓存</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="executeShellCommand('openWinCmd')">打开windows命令行</el-button>
        <el-button type="primary" @click="executeShellCommand('getPackageJson')">获取项目命令</el-button>
        <el-button type="primary" @click="executeShellCommand('getAllBranch')">获取分支</el-button>
      </el-form-item>
      <el-form-item>
        <el-select v-model="nowBranch" placeholder="Select" filterable>
          <el-option v-for="item in branchList" :key="item" :label="item" :value="item"/>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="executeShellCommand('getRecentGitLogs')">获取近一周提交日志</el-button>
      </el-form-item>
      <!-- 新增 Kimi 官网和 Deepseek 官网的按钮 -->
      <el-form-item>
        <el-button type="primary" @click="handleRedirectAndCopy('https://www.kimi.com')">跳转到 Kimi 官网</el-button>
        <el-button type="primary" @click="handleRedirectAndCopy('https://chat.deepseek.com')">跳转到 Deepseek 官网</el-button>
      </el-form-item>
      <el-form-item label="">
        <el-input type="textarea" v-model="recentGitLogs" rows="5" readonly />
      </el-form-item>
    </el-form>
    <div class="flex flex-wrap gap-2 my-2">
      <el-tag v-for="(tag, index) in formList" :key="tag.name" class="mx-1" :class="{'tagChecked': checkedIndex === index}" @click="setInfo(index)" closable :disable-transitions="false" @close="handleClose(tag)">
        {{ tag.name }}
      </el-tag>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import {computed, onMounted, reactive, ref} from 'vue';
import {ElMessage} from 'element-plus';
import {ipcRenderer, shell} from 'electron'; // 引入 Electron 的 shell 模块
interface FormInline {
  name: string;
  file: string;
  text: string;
  url: string;
  isSSH: boolean;
}

interface FromSSH {
  isShow: string;
  sshUrl: string;
  sshName: string;
  sshPassword: string;
  sshShell: string;
}

const checkedIndex = ref<number | null>(null);
const formInline = reactive({
  name: '',
  file: '',
  text: '',
  url: '',
  isSSH: false,
});
const nowBranch = ref<string>('');
const branchList = ref<string[]>([]);
const fromSSH = reactive({
  isShow: 'ssh',
  sshUrl: '',
  sshName: '',
  sshPassword: '',
  sshShell: '',
});
const formList = ref<FormInline[]>([]);

ipcRenderer.on('command-result', (event, arg) => {
  console.log('command-result---监听来自主进程的回复', arg);
  ElMessage(arg.result ? arg.result : arg.error);
});

ipcRenderer.on('send-object', (event, obj) => {
  console.log('send-object---监听主进程的回复:', obj);
  formList.value = obj ? obj : formList.value;
});

ipcRenderer.on('sendSSHCache', (event, obj) => {
  console.log('sendSSHCache---监听主进程的回复:', obj);
  Object.assign(fromSSH, obj);
});
ipcRenderer.on('command-noMsg', (event, obj) => {
  console.log('command-noMsg---监听主进程的回复:', obj.fn, obj.result);
  if (obj.fn === 'getAllBranch') {
    const branches = parseBranches(obj.result);
    branchList.value = branches.formatted;
    nowBranch.value = branches.current as string;
  }else if(obj.fn === 'getRecentGitLogs') {
    recentGitLogs.value = `**任务**：请根据以下 Git 提交日志，帮助总结出我这一周的工作内容，重点包括所完成的功能、修复的 bug、优化的部分，以及任何重要的进展或决策。

**Git 提交日志**：
${obj.result}

**要求**：
1. 简洁明了地总结每个主要任务。
2. 按照时间顺序列出每项工作。
3. 对于每个工作，提供简短的描述，包括所涉及的模块、功能、bug 修复或性能优化等。`; // 保存获取到的日志

  } else if (obj.fn === 'getGitUserName') {
    myGitName.value = obj.result; // 保存获取到的 Git 用户名
  }
});
const myGitName = ref<string>('');
// 创建一个通用函数，负责复制和跳转
const handleRedirectAndCopy = (url: string) => {
  // 复制近一周的提交日志
  if (recentGitLogs.value) {
    navigator.clipboard.writeText(recentGitLogs.value)
      .then(() => {
        ElMessage.success('提交日志已复制到剪贴板');
      })
      .catch((err) => {
        ElMessage.error('复制失败');
        console.error('复制失败', err);
      });
  } else {
    ElMessage.warning('没有可复制的提交日志');
  }

  // 使用 Electron 的 shell 模块打开外部链接
  shell.openExternal(url);
};
const parseBranches = (branchOutput: string) => {
  const branches = branchOutput.split('\n').map(branch => branch.trim());
  const formatted = branches.map(branch => branch.replace(/^\* /, ''));
  const current = branches.find(branch => branch.startsWith('*'));
  return { formatted, current: current ? current.slice(2) : null };
};

const commands = computed(() => ({
  openWinCmd: 'start cmd.exe',
  getPackageJson: `type package.json | jq '.scripts'`,
  getAllBranch: `cd ${formInline.file} && git branch -a`,
  gitPull: `cd ${formInline.file} && git pull`,
  gitPush: `cd ${formInline.file} && git push`,
  gitCommit: `cd ${formInline.file} && git add . && git commit -m ${formInline.text} && git push`,
  setNewUrl: `cd ${formInline.file} && git remote set-url origin ${formInline.url}`,
  getTheUrl: `cd ${formInline.file} && git remote -v`,
  // 获取 Git 用户名
  getGitUserName: `cd ${formInline.file} && git config user.name`,
  // 新增命令：获取近一周提交日志
  getRecentGitLogs: `cd ${formInline.file} && git log --since="1 week ago" --author=${myGitName.value} --no-merges --pretty=format:"%s"`
}));
const recentGitLogs = ref<string>(''); // 用于存储获取的 Git 提交日志
// 修改 executeShellCommand 方法，添加逻辑来处理 Git 日志输出
const executeShellCommand = (commandsKey: keyof typeof commands.value, isMessage = false) => {
  // 检查 formInline.file 是否为空
  if (!formInline.file) {
    ElMessage.error('请先填写本地目录路径！');
    return; // 如果为空，终止命令执行
  }
  console.log('执行命令', commandsKey);
  ipcRenderer.send('executeShellCommand', ({
    fn: commandsKey,
    command: commands.value[commandsKey],
    isMessage,
  }));

  // 监听执行结果并保存日志
  if (commandsKey === 'getRecentGitLogs') {
    ipcRenderer.once('command-result', (event, arg) => {
      if (arg.result) {
        recentGitLogs.value = arg.result; // 保存获取到的日志
      } else {
        ElMessage.error('获取提交日志失败');
      }
    });
  }
};

const SSHAct = () => {
  console.log('执行远程');
  ipcRenderer.send('saveSSHCache', JSON.stringify(fromSSH));
  ipcRenderer.send('SSHAct', JSON.stringify(fromSSH));
};

const handleClose = (tag: FormInline) => {
  formList.value.splice(formList.value.indexOf(tag), 1);
  ipcRenderer.send('save-object', JSON.stringify(formList.value));
};

const deepEqual = (obj1: Partial<FormInline>, obj2: Partial<FormInline>) => {
  const keys1 = Object.keys(obj1) as (keyof FormInline)[];
  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return true;
    }
  }
  return false;
};

const saveToCache = () => {
  console.log('formList', formList.value);
  for (let item of formList.value) {
    if (item.name === formInline.name) {
      if (deepEqual(item, formInline)) {
        const pushIndex = formList.value.indexOf(item);
        formList.value[pushIndex] = { ...formInline };
        ipcRenderer.send('save-object', JSON.stringify(formList.value));
        ElMessage.success('更新缓存成功');
        getCache();
      } else {
        ElMessage.error('该数据已存在');
      }
      return;
    }
  }
  formList.value.push({ ...formInline });
  ipcRenderer.send('save-object', JSON.stringify(formList.value));
  getCache();
};

const restCache = () => {
  formList.value = [];
  ElMessage.success('已清空缓存');
  ipcRenderer.send('save-object', JSON.stringify([]));
};

const getCache = () => {
  ipcRenderer.send('get-object');
};

const getSSHCache = () => {
  ipcRenderer.send('getSSHCache');
};

const setInfo = (index: number) => {
  checkedIndex.value = index;
  console.log('formList.value[index]', index, formList.value[index]);
  for (let key in formList.value[index]) {
      (formInline as any)[key] = (formList.value[index] as any)[key];
  }
  executeShellCommand('getGitUserName');
};

onMounted(() => {
  getCache();
  getSSHCache();
});
</script>

<style>
.demo-form-inline .el-input {
  --el-input-width: 220px;
}

.el-tag.is-closable {
  margin-right: 5px;
}

.tagChecked {
  background: #79bbff;
  color: white;
  box-shadow: 0 0 10px 5px white;
}
</style>
