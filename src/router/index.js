import Vue from "vue";
import Router from "vue-router";
Vue.use(Router);

const routes = [
  {
    path: "/",
    name: "main",
    component: () => import("@/views/main.vue"),
  },
];

const router = new Router({
  mode: "hash",
  scrollBehavior: () => ({ y: 0 }),
  routes,
});
export default router;
