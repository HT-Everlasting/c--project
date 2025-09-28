<!--
  智能酒店自助登记系统页面
  技术栈说明：
  - Vue3 + <script setup> 语法糖，组合式API
  - TypeScript 静态类型
  - Element Plus 组件库（el-form, el-input, el-select, el-dialog等）
  - axios 用于HTTP请求
  - dayjs 用于日期处理
  - 响应式数据与计算属性实现表单交互和费用计算
-->

<template>
  <div class="checkin-container">
    <!-- 顶部标题与说明 -->
    <div class="header">
      <h1>智能酒店自助登记系统</h1>
      <p>欢迎使用自助登记服务，请填写以下信息完成入住登记</p>
    </div>

    <div class="main-content">
      <!-- 使用Element Plus卡片组件包裹表单 -->
      <el-card class="checkin-card">
        <!-- 卡片头部插槽 -->
        <template #header>
          <div class="card-header">
            <span>客人信息登记</span>
          </div>
        </template>

        <!-- 登记表单，使用el-form实现，支持校验 -->
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="120px"
          class="checkin-form"
        >
          <!-- 房间选择，动态加载可用房间 -->
          <el-form-item label="选择房间" prop="roomId">
            <el-select
              v-model="form.roomId"
              placeholder="请选择房间"
              style="width: 100%"
              @change="handleRoomChange"
            >
              <!-- 遍历可用房间，展示房间号、类型和价格 -->
              <el-option
                v-for="room in availableRooms"
                :key="room.id"
                :label="`${room.room_number} - ${room.room_type} (¥${room.price}/晚)`"
                :value="room.id"
              />
            </el-select>
          </el-form-item>

          <!-- 入住日期选择，禁用历史日期 -->
          <el-form-item label="入住日期" prop="checkInDate">
            <el-date-picker
              v-model="form.checkInDate"
              type="date"
              placeholder="选择入住日期"
              style="width: 100%"
              :disabled-date="disabledDate"
            />
          </el-form-item>

          <!-- 退房日期选择，禁用历史日期 -->
          <el-form-item label="退房日期" prop="checkOutDate">
            <el-date-picker
              v-model="form.checkOutDate"
              type="date"
              placeholder="选择退房日期"
              style="width: 100%"
              :disabled-date="disabledDate"
            />
          </el-form-item>

          <!-- 智能锁密码，6位数字，输入时自动过滤非数字 -->
          <el-form-item label="智能锁密码" prop="lockCode">
            <el-input
              v-model="form.lockCode"
              placeholder="请输入6位数字密码"
              maxlength="6"
              show-password
              @input="handleLockCodeInput"
            />
            <div class="password-tip">请设置6位数字密码，用于房间智能锁</div>
          </el-form-item>

          <!-- 客人姓名 -->
          <el-form-item label="客人姓名" prop="name">
            <el-input v-model="form.name" placeholder="请输入真实姓名" />
          </el-form-item>

          <!-- 身份证号，18位 -->
          <el-form-item label="身份证号" prop="idCard">
            <el-input v-model="form.idCard" placeholder="请输入18位身份证号" maxlength="18" />
          </el-form-item>

          <!-- 手机号，11位 -->
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
          </el-form-item>

          <!-- 性别选择，单选 -->
          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="form.gender">
              <el-radio label="男">男</el-radio>
              <el-radio label="女">女</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 邮箱，选填 -->
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱地址（可选）" />
          </el-form-item>

          <!-- 地址，选填 -->
          <el-form-item label="地址" prop="address">
            <el-input
              v-model="form.address"
              type="textarea"
              placeholder="请输入详细地址（可选）"
              :rows="2"
            />
          </el-form-item>

          <!-- 费用预览，入住天数和总费用，依赖房间和日期选择 -->
          <el-form-item v-if="selectedRoom && form.checkInDate && form.checkOutDate" label="费用预览">
            <div class="cost-preview">
              <p>房间类型：{{ selectedRoom.room_type }}</p>
              <p>房间号：{{ selectedRoom.room_number }}</p>
              <p>入住天数：{{ stayDays }} 晚</p>
              <p class="total-cost">总费用：¥{{ totalCost }}</p>
            </div>
          </el-form-item>

          <!-- 提交与重置按钮 -->
          <el-form-item>
            <el-button type="primary" @click="handleSubmit" :loading="loading" size="large">
              完成登记
            </el-button>
            <el-button @click="handleReset" size="large">重置表单</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 成功对话框，登记成功后弹出，展示关键信息 -->
    <el-dialog v-model="successDialog" title="登记成功" width="500px" center>
      <div class="success-content">
        <el-icon class="success-icon" color="#67C23A" size="60">
          <CircleCheckFilled />
        </el-icon>
        <h3>恭喜！登记成功</h3>
        <div class="success-info">
          <p><strong>房间号：</strong>{{ successInfo.roomNumber }}</p>
          <p><strong>智能锁密码：</strong>{{ successInfo.lockCode }}</p>
          <p><strong>总费用：</strong>¥{{ successInfo.totalAmount }}</p>
        </div>
        <div class="success-tips">
          <p>请记住您的智能锁密码，退房时需要使用</p>
          <p>祝您入住愉快！</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="handleSuccessConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/*
  依赖导入说明：
  - vue: 组合式API（ref, reactive, computed, onMounted）
  - element-plus: UI组件库
  - @element-plus/icons-vue: 图标
  - axios: HTTP请求
  - dayjs: 日期处理
*/
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'
import axios from 'axios'
import dayjs from 'dayjs'

// 响应式数据定义
const formRef = ref() // 表单引用，用于校验和重置
const loading = ref(false) // 提交按钮加载状态
const successDialog = ref(false) // 成功对话框显示状态
const availableRooms = ref([]) // 可用房间列表
const selectedRoom = ref(null) // 当前选中房间对象
const successInfo = ref({}) // 登记成功后返回的信息

// 表单数据，使用reactive实现响应式
const form = reactive({
  roomId: '',        // 房间ID
  checkInDate: '',   // 入住日期
  checkOutDate: '',  // 退房日期
  lockCode: '',      // 智能锁密码
  name: '',          // 姓名
  idCard: '',        // 身份证号
  phone: '',         // 手机号
  gender: '',        // 性别
  email: '',         // 邮箱
  address: '',       // 地址
  birthDate: ''      // 预留字段
})

// 表单校验规则，Element Plus表单校验
const rules = {
  roomId: [{ required: true, message: '请选择房间', trigger: 'change' }],
  checkInDate: [{ required: true, message: '请选择入住日期', trigger: 'change' }],
  checkOutDate: [{ required: true, message: '请选择退房日期', trigger: 'change' }],
  lockCode: [
    { required: true, message: '请设置智能锁密码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '密码必须是6位数字', trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^\d{17}[\dXx]$/, message: '身份证号格式不正确', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }]
}

// 计算属性：入住天数
const stayDays = computed(() => {
  // 若未选择日期，返回0
  if (!form.checkInDate || !form.checkOutDate) return 0
  // 计算退房与入住日期的天数差
  return dayjs(form.checkOutDate).diff(dayjs(form.checkInDate), 'day')
})

// 计算属性：总费用
const totalCost = computed(() => {
  // 若未选房间或天数为0，费用为0
  if (!selectedRoom.value || !stayDays.value) return 0
  // 费用=单价*天数，保留两位小数
  return (selectedRoom.value.price * stayDays.value).toFixed(2)
})

// 禁用历史日期，Element Plus日期选择器用
const disabledDate = (time: Date) => {
  // 只允许选择今天及以后
  return time.getTime() < Date.now() - 8.64e7
}

// 智能锁密码输入处理，只允许6位数字
const handleLockCodeInput = (value: string) => {
  // 替换非数字，截取前6位
  form.lockCode = value.replace(/\D/g, '').slice(0, 6)
}

// 房间选择变化时，设置当前选中房间对象
const handleRoomChange = (roomId: string) => {
  selectedRoom.value = availableRooms.value.find(room => room.id === roomId)
}

// 加载可用房间列表，页面挂载时调用
const loadAvailableRooms = async () => {
  try {
    const response = await axios.get('/api/rooms/available')
    if (response.data.success) {
      availableRooms.value = response.data.data
    }
  } catch (error) {
    ElMessage.error('获取可用房间失败')
  }
}

// 表单提交处理
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    // 校验表单
    await formRef.value.validate()
    loading.value = true
    
    // 提交登记信息
    const response = await axios.post('/api/guests/register', form)
    
    if (response.data.success) {
      // 成功后保存返回信息并弹窗
      successInfo.value = response.data.data
      successDialog.value = true
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (error) {
    // 错误处理
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('登记失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

// 重置表单
const handleReset = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  selectedRoom.value = null
}

// 成功对话框确认按钮
const handleSuccessConfirm = () => {
  successDialog.value = false
  handleReset()
  ElMessage.success('登记完成，欢迎入住！')
}

// 生命周期钩子，页面加载时获取房间列表
onMounted(() => {
  loadAvailableRooms()
})
</script>

<style scoped>
/* 页面整体样式，渐变背景，居中布局 */
.checkin-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* 顶部标题样式 */
.header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

/* 主体内容居中 */
.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* 卡片样式 */
.checkin-card {
  width: 100%;
  max-width: 800px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
}

.card-header {
  font-size: 1.5rem;
  font-weight: bold;
  color: #409EFF;
}

.checkin-form {
  padding: 20px 0;
}

/* 密码提示样式 */
.password-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

/* 费用预览样式 */
.cost-preview {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #409EFF;
}

.cost-preview p {
  margin: 5px 0;
  color: #606266;
}

.total-cost {
  font-size: 18px;
  font-weight: bold;
  color: #E6A23C !important;
  margin-top: 10px !important;
}

/* 成功弹窗样式 */
.success-content {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  margin-bottom: 20px;
}

.success-content h3 {
  color: #67C23A;
  margin-bottom: 20px;
}

.success-info {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: left;
}

.success-info p {
  margin: 8px 0;
  color: #606266;
}

.success-tips {
  color: #909399;
  font-size: 14px;
}

.success-tips p {
  margin: 5px 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .checkin-container {
    padding: 10px;
  }
  
  .header h1 {
    font-size: 2rem;
  }
  
  .header p {
    font-size: 1rem;
  }
  
  .checkin-card {
    margin: 0 10px;
  }
}
</style> 