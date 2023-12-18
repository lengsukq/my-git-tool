<template>
  <el-form :inline="true" :model="formInline" class="demo-form-inline">
    <el-form-item label="本地目录">
      <el-input v-model="formInline.file" placeholder="" clearable />
    </el-form-item>
    <el-form-item label="提交描述">
      <el-input v-model="formInline.text" placeholder="" clearable />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="gitPull">更新</el-button>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="gitCommit">提交</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
const { ipcRenderer } = require('electron')
const formInline = reactive({
  file: '',
  text: '',
})
// 监听来自主进程的回复
ipcRenderer.on('command-result', (event, arg) => {
  console.log('监听来自主进程的回复', arg);
  // 在这里可以处理来自主进程的回复
});
const gitPull = () => {
// 向主进程发送消息
  ipcRenderer.send('gitPull', JSON.stringify(formInline));
}
const gitCommit = () => {
// 向主进程发送消息
  ipcRenderer.send('gitCommit', JSON.stringify(formInline));
}
</script>

<style>
.demo-form-inline .el-input {
  --el-input-width: 220px;
}
</style>
