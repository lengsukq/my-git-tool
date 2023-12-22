import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: ()=>import("../views/home.vue"),
    meta: {
      title: 'Home Page' // 设置首页标题为 'Home Page'
    }
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes


});

export default router;
