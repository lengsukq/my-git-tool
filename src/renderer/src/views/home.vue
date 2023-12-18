<template>
  <el-form :inline="true" :model="formInline" class="demo-form-inline">
    <el-form-item label="别名">
      <el-input v-model="formInline.name" placeholder="" clearable />
    </el-form-item>
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
    <el-form-item>
      <el-button type="primary" @click="saveToCache">保存</el-button>
    </el-form-item>
    <el-form-item>
      <el-button type="" @click="getCache">本地</el-button>
    </el-form-item>
    <el-form-item>
      <el-button type="" @click="restCache">清空</el-button>
    </el-form-item>
  </el-form>
  <el-radio-group v-model="radio" class="ml-4">
    <el-radio :label="item.name" size="large" v-for="item in formList" @click="setInfo">{{item.name}}</el-radio>
  </el-radio-group>
</template>

<script lang="ts" setup>
import { reactive,ref,onMounted } from 'vue';
const { ipcRenderer } = require('electron');
import { ElMessage } from 'element-plus'
const formInline = reactive({
  name:'',
  file: '',
  text: '',
})
const radio = ref('')
const formList = ref([])
// 监听来自主进程的回复
ipcRenderer.on('command-result', (event, arg) => {
  console.log('监听来自主进程的回复', arg);
  // 在这里可以处理来自主进程的回复
  ElMessage(arg.result?arg.result:arg.error)
});
// 监听主进程的回复
ipcRenderer.on('send-object', (event, obj) => {
  console.log('Received object from main process:', obj);
  // 在这里处理接收到的对象数据
  formList.value = obj;
});
const gitPull = () => {
// 向主进程发送消息
  ipcRenderer.send('gitPull', JSON.stringify(formInline));
}
const gitCommit = () => {
// 向主进程发送消息
  ipcRenderer.send('gitCommit', JSON.stringify(formInline));
}
const saveToCache= ()=>{
  // 向主进程发送保存对象的消息
  for (let item of formList.value){
    console.log('item---item',item.value)
    if (item.value === radio.value){
      ElMessage('该别名已存在')
      return;
    }
  }
  formList.value.push(deepClone(formInline));

  ipcRenderer.send('save-object', JSON.stringify(formList.value));
}
const restCache = ()=>{
  formList.value = [];
  ElMessage.success('已清空缓存');
  ipcRenderer.send('save-object', JSON.stringify([]));

}
const deepClone = (obj) =>{
  return JSON.parse(JSON.stringify(obj));
}
const getCache = ()=>{
  // 向主进程发送获取对象的消息
  ipcRenderer.send('get-object');
}
const setInfo =()=>{
  for (let item of formList.value){
    if (item.name === radio.value){
      Object.assign(formInline, item);
      break;
    }
  }
}
onMounted(()=>{
  getCache();
})
</script>

<style>
.demo-form-inline .el-input {
  --el-input-width: 220px;
}
</style>
