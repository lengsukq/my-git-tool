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
      <el-form-item>
        <el-button type="primary" @click="gitCommit">提交代码</el-button>
        <el-button  @click="gitPull">更新代码</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="setNewUrl">更新仓库地址</el-button>
        <el-button type="" @click="getTheUrl">获取仓库地址</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="saveToCache">存到缓存</el-button>
        <el-button type="" @click="getCache">获取缓存</el-button>
        <el-button type="" @click="restCache">清空缓存</el-button>
      </el-form-item>

    </el-form>
    <div class="flex flex-wrap gap-2 my-2">
      <el-tag
        v-for="(tag,index) in formList"
        :key="tag.name"
        class="mx-1"
        :class="{'tagChecked':checkedIndex===index}"
        @click="setInfo(index)"
        closable
        :disable-transitions="false"
        @close="handleClose(tag)"
      >
        {{ tag.name }}
      </el-tag>
    </div>
  </el-card>


</template>

<script lang="ts" setup>
import {onMounted, reactive, ref} from 'vue';
import {ElMessage} from 'element-plus'

const {ipcRenderer} = require('electron');
const checkedIndex = ref(null)
const formInline = reactive({
  name: '',
  file: '',
  text: '',
  url: '',
})
const radio = ref('')
const formList = ref([])
// 监听来自主进程的回复
ipcRenderer.on('command-result', (event, arg) => {
  console.log('监听来自主进程的回复', arg);
  // 在这里可以处理来自主进程的回复
  ElMessage(arg.result ? arg.result : arg.error)
});
// 监听主进程的回复
ipcRenderer.on('send-object', (event, obj) => {
  console.log('监听主进程的回复:', obj);
  // 在这里处理接收到的对象数据
  formList.value = obj;
});
const handleClose = (tag) => {
  formList.value.splice(formList.value.indexOf(tag), 1);
  ipcRenderer.send('save-object', JSON.stringify(formList.value));
}
const gitPull = () => {
// 向主进程发送消息
  ipcRenderer.send('gitPull', JSON.stringify(formInline));
}
const gitCommit = () => {
  // saveToCache();
// 向主进程发送消息
  ipcRenderer.send('gitCommit', JSON.stringify(formInline));
}
const setNewUrl = () => {
// 向主进程发送消息
  ipcRenderer.send('setNewUrl', JSON.stringify(formInline));
}
const getTheUrl = () => {
// 向主进程发送消息
  ipcRenderer.send('getTheUrl', JSON.stringify(formInline));
}
const saveToCache = () => {
  // 向主进程发送保存对象的消息
  for (let item of formList.value) {
    if (item.name === formInline.name) {
      if (item.text !== formInline.text || item.file !==formInline.file){
        let pushIndex = formList.value.indexOf(item);
        formList.value[pushIndex] = formInline;
        ipcRenderer.send('save-object', JSON.stringify(formList.value));
        ElMessage.success('更新缓存成功');
        getCache();
      }else{
        ElMessage.error('该数据已存在');
      }
      return false;
    }
  }
  formList.value.push(deepClone(formInline));

  ipcRenderer.send('save-object', JSON.stringify(formList.value));
  getCache();
}
const restCache = () => {
  formList.value = [];
  ElMessage.success('已清空缓存');
  ipcRenderer.send('save-object', JSON.stringify([]));

}
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
}
const getCache = () => {
  // 向主进程发送获取对象的消息
  ipcRenderer.send('get-object');
}
const setInfo = (index) => {
  checkedIndex.value = index;
  console.log('formList.value[index]', index, formList.value[index])
  // Object.assign(formInline, formList.value[index]);
  for(let key in formList.value[index]){
    formInline[key] = formList.value[index][key];
  }
}
onMounted(() => {
  getCache();
})
</script>

<style>
.demo-form-inline .el-input {
  --el-input-width: 220px;
}
.el-tag.is-closable{
  margin-right: 5px;
}
.tagChecked{
  background: #79bbff;
  color: white;
  box-shadow: 0 0 10px 5px white; /* 添加白色阴影 */
}
</style>
