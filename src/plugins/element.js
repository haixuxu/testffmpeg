import Vue from "vue";
// 在下面的大括号中按需导入所需 Element-UI 中的组件即可
import {
  Button,
  Form,
  FormItem,
  Input,
  Message,
  Radio,
  RadioGroup,
  Progress,
  Drawer,
  Avatar,
  MessageBox,
  Tabs,
  TabPane,
  Loading,
  Select,
  Option,
  Checkbox
} from "element-ui";
// 注意：导入的组件都需要使用 Vue.use() 进行注册
Vue.use(Button);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Input);
Vue.use(Radio);
Vue.use(RadioGroup);
Vue.use(Drawer);
Vue.use(Avatar);
Vue.use(Tabs);
Vue.use(TabPane);
Vue.use(Progress);
Vue.use(Select);
Vue.use(Option);
Vue.use(Checkbox);
Vue.use(Loading.directive);

Vue.prototype.$loading = Loading.service;
Vue.prototype.$message = Message;
Vue.prototype.$confirm = MessageBox.confirm;
