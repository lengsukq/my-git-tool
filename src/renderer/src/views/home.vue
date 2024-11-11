<template>
  <el-container>
    <!-- 左侧侧边栏 -->
    <el-aside width="400px" style="background-color: #f5f7fa; display: flex; flex-direction: column;">
      <!-- 表单部分 -->
      <el-card class="box-card" style="flex: 1 1 auto; overflow-y: auto;">
        <template #header>
          <el-tag
            v-for="(tag, index) in formList"
            :key="tag.name"
            :class="{ tagChecked: checkedIndex === index }"
            @click="setInfo(index)"
            closable
            :disable-transitions="false"
            @close="handleClose(tag)"
          >
            {{ tag.name }}
          </el-tag>
        </template>
        <el-form :model="formInline" label-width="100px">
          <el-form-item label="项目别名">
            <el-input v-model="formInline.name" placeholder="请输入项目别名" clearable />
          </el-form-item>
          <el-form-item label="本地目录">
            <el-input v-model="formInline.file" placeholder="请输入本地目录路径" clearable />
          </el-form-item>
          <el-form-item label="仓库地址">
            <el-input v-model="formInline.url" placeholder="请输入仓库地址" clearable />
          </el-form-item>
          <el-form-item label="提交描述">
            <el-input
              v-model="formInline.text"
              type="textarea"
              placeholder="请输入提交描述"
              show-word-limit
              clearable
            />
          </el-form-item>
          <el-form-item label="远程命令">
            <el-switch v-model="formInline.isSSH" active-text="启用" inactive-text="禁用"></el-switch>
            <el-button type="primary" class="mgl12" v-if="formInline.isSSH" @click="SSHAct">执行远程</el-button>
          </el-form-item>
          <!-- 模态框触发按钮 -->
          <el-button type="text" @click="dialogVisible = true" v-if="formInline.isSSH">
            配置远程设置
          </el-button>
        </el-form>
        <!-- SSH 配置模态框 -->
        <el-dialog
          title="远程配置"
          v-model="dialogVisible"
          width="40%"
          @close="resetSSHForm"
        >
          <el-form :model="fromSSH" label-width="100px">
            <el-form-item label="远程地址">
              <el-input v-model="fromSSH.sshUrl" placeholder="请输入远程地址" show-word-limit clearable />
            </el-form-item>
            <el-form-item label="连接用户">
              <el-input v-model="fromSSH.sshName" placeholder="请输入连接用户" show-word-limit clearable />
            </el-form-item>
            <el-form-item label="连接密码">
              <el-input
                v-model="fromSSH.sshPassword"
                type="password"
                placeholder="请输入连接密码"
                show-word-limit
                clearable
              />
            </el-form-item>
            <el-form-item label="执行命令">
              <el-input
                v-model="fromSSH.sshShell"
                type="textarea"
                placeholder="请输入执行命令"
                show-word-limit
                clearable
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="resetSSHForm">取消</el-button>
            <el-button type="primary" @click="saveAndCloseDialog">保存</el-button>
          </template>
        </el-dialog>
      </el-card>
    </el-aside>

    <!-- 主内容区 -->
    <el-main style="overflow-y: auto;padding: 0">
      <el-card class="box-card">
        <el-form label-width="80px">
          <!-- 操作按钮组 -->
          <el-form-item label="操作">
            <el-button type="primary" @click="executeShellCommand('gitCommit', true)">提交代码</el-button>
            <el-button type="success" @click="executeShellCommand('gitPush', true)">推送代码</el-button>
            <el-button type="warning" @click="executeShellCommand('gitPull', true)">更新代码</el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="executeShellCommand('setNewUrl', true)">更新仓库地址</el-button>
            <el-button type="primary" @click="executeShellCommand('getTheUrl', true)">获取仓库地址</el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveToCache">存到缓存</el-button>
            <el-button type="primary" @click="getCache">获取缓存</el-button>
            <el-button type="danger" @click="restCache">清空缓存</el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="executeShellCommand('openWinCmd')">打开 Windows 命令行</el-button>
            <el-button type="primary" @click="executeShellCommand('getPackageJson')">获取项目命令</el-button>
            <el-button type="primary" @click="executeShellCommand('getAllBranch')">获取分支</el-button>
            <el-button type="primary" class="mgl12" @click="switchBranch">切换分支</el-button>
          </el-form-item>
          <el-form-item label="当前分支">
            <el-select v-model="selectedBranch" placeholder="请选择当前分支" filterable>
              <el-option v-for="item in branchList" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="executeShellCommand('getRecentGitLogs')">获取近一周提交日志</el-button>
          </el-form-item>
          <el-form-item label="快速访问">
            <el-button type="primary" @click="handleRedirectAndCopy('https://kimi.moonshot.cn')">Kimi</el-button>
            <el-button type="primary" @click="handleRedirectAndCopy('https://chat.deepseek.com')">Deepseek</el-button>
          </el-form-item>
          <el-form-item label="提交日志">
            <el-input type="textarea" v-model="recentGitLogs" rows="5" readonly />
          </el-form-item>
        </el-form>
      </el-card>
    </el-main>
  </el-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import { ipcRenderer, shell } from 'electron'; // 引入 Electron 的 shell 模块

interface FormInline {
  name: string;
  file: string;
  text: string;
  url: string;
  isSSH: boolean;
}

interface FromSSH {
  sshUrl: string;
  sshName: string;
  sshPassword: string;
  sshShell: string;
}

const checkedIndex = ref<number | null>(null);
const formInline = reactive<FormInline>({
  name: '',
  file: '',
  text: '',
  url: '',
  isSSH: false,
});
const nowBranch = ref<string>('');
const selectedBranch = ref<string>(''); // 临时变量
const branchList = ref<string[]>([]);
const fromSSH = reactive<FromSSH>({
  sshUrl: '',
  sshName: '',
  sshPassword: '',
  sshShell: '',
});
const formList = ref<FormInline[]>([]);

const dialogVisible = ref<boolean>(false);
const recentGitLogs = ref<string>(''); // 用于存储获取的 Git 提交日志
const myGitName = ref<string>('');

// 初始化标志，防止初始化时触发按钮点击逻辑
const isBranchInitialized = ref<boolean>(false);

// 监听其他 IPC 事件
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
    selectedBranch.value = branches.current as string; // 同步 selectedBranch
    isBranchInitialized.value = true; // 标记初始化完成
  } else if (obj.fn === 'getRecentGitLogs') {
    recentGitLogs.value = `**任务**：请根据以下 Git 提交日志，帮助总结出我这一周的工作内容，重点包括所完成的功能、修复的 bug、优化的部分，以及任何重要的进展或决策。

**Git 提交日志**：

${obj.result}

**要求**：

1. 简洁明了地总结每个主要任务。
2. 按照时间顺序列出每项工作。
3. 对于每个工作，提供简短的描述，包括所涉及的模块、功能、bug 修复或性能优化等。`;
  } else if (obj.fn === 'getGitUserName') {
    myGitName.value = obj.result; // 保存获取到的 Git 用户名
  }
});

// 处理重定向和复制
const handleRedirectAndCopy = (url: string) => {
  if (recentGitLogs.value) {
    navigator.clipboard
      .writeText(recentGitLogs.value)
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

  setTimeout(() => {
    shell.openExternal(url);
  }, 2000);
};

// 解析分支信息
const parseBranches = (branchOutput: string) => {
  const branches = branchOutput.split('\n').map((branch) => branch.trim());
  const formatted = branches.map((branch) => branch.replace(/^\* /, ''));
  const current = branches.find((branch) => branch.startsWith('*'));
  return { formatted, current: current ? current.slice(2) : null };
};

// 定义命令
const commands = computed(() => ({
  openWinCmd: 'start cmd.exe',
  getPackageJson: `type package.json | jq '.scripts'`,
  getAllBranch: `cd "${formInline.file}" && git branch -a`,
  gitPull: `cd "${formInline.file}" && git pull`,
  gitPush: `cd "${formInline.file}" && git push`,
  gitCommit: `cd "${formInline.file}" && git add . && git commit -m "${formInline.text}" && git push`,
  setNewUrl: `cd "${formInline.file}" && git remote set-url origin ${formInline.url}`,
  getTheUrl: `cd "${formInline.file}" && git remote -v`,
  getGitUserName: `cd "${formInline.file}" && git config user.name`,
  getRecentGitLogs: `cd "${formInline.file}" && git log --since="1 week ago" --author=${myGitName.value} --no-merges --pretty=format:"%s"`,
  switchBranch: (branch: string) => `cd "${formInline.file}" && git checkout ${branch}`,
}));

// 执行命令
const executeShellCommand = (
  commandsKey: keyof typeof commands.value,
  isMessage = false,
  branchToSwitch?: string
) => {
  if (!formInline.file) {
    ElMessage.error('请先填写本地目录路径！');
    return;
  }
  console.log('执行命令', commandsKey);
  let commandToExecute: string;

  if (commandsKey === 'switchBranch' && branchToSwitch) {
    commandToExecute = commands.value.switchBranch(branchToSwitch);
  } else {
    commandToExecute = commands.value[commandsKey];
  }

  // 显示加载状态（可选）
  // const loading = ElLoading.service({
  //   lock: true,
  //   text: '执行中...',
  //   background: 'rgba(0, 0, 0, 0.7)',
  // });

  ipcRenderer.send('executeShellCommand', {
    fn: commandsKey,
    command: commandToExecute,
    isMessage,
  });

  ipcRenderer.once('command-result', (event, arg) => {
    // loading.close();
    if (arg.result) {
      ElMessage.success(arg.result.trim());
      if (commandsKey === 'getRecentGitLogs') {
        recentGitLogs.value = `**任务**：请根据以下 Git 提交日志，帮助总结出我这一周的工作内容，重点包括所完成的功能、修复的 bug、优化的部分，以及任何重要的进展或决策。

**Git 提交日志**：

${arg.result}

**要求**：

1. 简洁明了地总结每个主要任务。
2. 按照时间顺序列出每项工作。
3. 对于每个工作，提供简短的描述，包括所涉及的模块、功能、bug 修复或性能优化等。`;
      } else if (commandsKey === 'getCurrentBranch') {
        nowBranch.value = arg.result.trim();
      } else if (commandsKey === 'switchBranch') {
        // 更新当前分支
        nowBranch.value = branchToSwitch!;
        selectedBranch.value = branchToSwitch!; // 同步 selectedBranch
      }
    } else {
      ElMessage.error(arg.error.trim());
      if (commandsKey === 'switchBranch') {
        // 切换失败，重置选择
        getCurrentBranch()
          .then((currentBranch) => {
            nowBranch.value = currentBranch;
            selectedBranch.value = currentBranch;
          })
          .catch(() => {
            nowBranch.value = '';
            selectedBranch.value = '';
          });
      }
    }
  });
};

// SSH 操作
const SSHAct = () => {
  console.log('执行远程');
  ipcRenderer.send('saveSSHCache', JSON.stringify(fromSSH));
  ipcRenderer.send('SSHAct', JSON.stringify(fromSSH));
};

// 关闭标签
const handleClose = (tag: FormInline) => {
  formList.value.splice(formList.value.indexOf(tag), 1);
  ipcRenderer.send('save-object', JSON.stringify(formList.value));
};

// 深比较
const deepEqual = (obj1: Partial<FormInline>, obj2: Partial<FormInline>) => {
  const keys1 = Object.keys(obj1) as (keyof FormInline)[];
  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return true;
    }
  }
  return false;
};

// 存储到缓存
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

// 重置缓存
const restCache = () => {
  formList.value = [];
  ElMessage.success('已清空缓存');
  ipcRenderer.send('save-object', JSON.stringify([]));
};

// 获取缓存
const getCache = () => {
  ipcRenderer.send('get-object');
};

// 获取 SSH 缓存
const getSSHCache = () => {
  ipcRenderer.send('getSSHCache');
};

// 设置标签信息
const setInfo = (index: number) => {
  checkedIndex.value = index;
  console.log('formList.value[index]', index, formList.value[index]);
  Object.assign(formInline, formList.value[index]);
  executeShellCommand('getGitUserName');
  selectedBranch.value = nowBranch.value; // 重置 selectedBranch
};

// 切换分支
const switchBranch = async () => {
  if (selectedBranch.value === nowBranch.value || !selectedBranch.value) {
    ElMessage.warning('请选择一个不同于当前的分支进行切换。');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `您确定要切换到分支 "${selectedBranch.value}" 吗？`,
      '确认切换分支',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    // 用户确认后执行切换分支
    executeShellCommand('switchBranch', true, selectedBranch.value);
  } catch (error) {
    // 用户取消，重置 selectedBranch 为 oldBranch
    ElMessage.info('已取消切换分支');
    selectedBranch.value = nowBranch.value;
  }
};

// 获取当前分支名称
const getCurrentBranch = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    ipcRenderer.once('command-result', (event, arg) => {
      if (arg.result) {
        resolve(arg.result.trim());
      } else {
        ElMessage.error('获取当前分支失败');
        reject('获取当前分支失败');
      }
    });

    ipcRenderer.send('executeShellCommand', {
      fn: 'getCurrentBranch',
      command: `cd "${formInline.file}" && git branch --show-current`,
      isMessage: false,
    });
  });
};

// 关闭模态框
const resetSSHForm = () => {
  dialogVisible.value = false;
  // 重置 SSH 表单内容（可选）
  // Object.assign(fromSSH, {
  //   sshUrl: '',
  //   sshName: '',
  //   sshPassword: '',
  //   sshShell: '',
  // });
};

// 保存并关闭模态框
const saveAndCloseDialog = () => {
  SSHAct();
  dialogVisible.value = false;
};

// 生命周期钩子
onMounted(() => {
  getCache();
  getSSHCache();
});
</script>

<style>

/* 选中标签样式 */
.tagChecked {
  background: #409eff;
  color: white;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
}


/* 辅助样式 */
.mgl12 {
  margin-left: 12px;
}

</style>
