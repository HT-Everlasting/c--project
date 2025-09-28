<template>
  <div class="checkout-container">
    <div class="header">
      <h1>智能酒店自助退房系统</h1>
      <p>请提供您的房间信息完成退房手续</p>
    </div>

    <div class="main-content">
      <el-card class="checkout-card">
        <template #header>
          <div class="card-header">
            <span>退房信息确认</span>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="120px"
          class="checkout-form"
        >
          <!-- 房间号 -->
          <el-form-item label="房间号" prop="roomNumber">
            <el-input 
              v-model="form.roomNumber" 
              placeholder="请输入房间号" 
              maxlength="10"
            />
          </el-form-item>

          <!-- 智能锁密码 -->
          <el-form-item label="智能锁密码" prop="lockCode">
            <el-input
              v-model="form.lockCode"
              placeholder="请输入6位数字密码"
              maxlength="6"
              show-password
              @input="handleLockCodeInput"
            />
            <div class="password-tip">请输入入住时设置的智能锁密码</div>
          </el-form-item>

          <!-- 提交按钮 -->
          <el-form-item>
            <el-button type="primary" @click="handleSubmit" :loading="loading" size="large">
              确认退房
            </el-button>
            <el-button @click="handleReset" size="large">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 退房成功对话框 -->
    <el-dialog v-model="successDialog" title="退房成功" width="500px" center>
      <div class="success-content">
        <el-icon class="success-icon" color="#67C23A" size="60">
          <CircleCheckFilled />
        </el-icon>
        <h3>退房成功！</h3>
        <div class="success-info">
          <p><strong>客人姓名：</strong>{{ successInfo.guestName }}</p>
          <p><strong>房间号：</strong>{{ successInfo.roomNumber }}</p>
          <p><strong>退房时间：</strong>{{ formatTime(successInfo.checkOutTime) }}</p>
          <p><strong>总费用：</strong>¥{{ successInfo.totalAmount }}</p>
        </div>
        <div class="success-tips">
          <p>感谢您的入住，欢迎再次光临！</p>
          <p>智能锁密码已自动重置</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="handleSuccessConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'
import axios from 'axios'
import dayjs from 'dayjs'

// 响应式数据
const formRef = ref()
const loading = ref(false)
const successDialog = ref(false)
const successInfo = ref({})

// 表单数据
const form = reactive({
  roomNumber: '',
  lockCode: ''
})

// 表单验证规则
const rules = {
  roomNumber: [
    { required: true, message: '请输入房间号', trigger: 'blur' }
  ],
  lockCode: [
    { required: true, message: '请输入智能锁密码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '密码必须是6位数字', trigger: 'blur' }
  ]
}

// 方法
const handleLockCodeInput = (value: string) => {
  form.lockCode = value.replace(/\D/g, '').slice(0, 6)
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    // 确保只发送房间号和密码
    const payload = {
      roomNumber: form.roomNumber,
      lockCode: form.lockCode,
    }
    
    const response = await axios.post('/api/bookings/checkout', payload)
    
    if (response.data.success) {
      successInfo.value = response.data.data
      successDialog.value = true
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (error: any) {
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('退房失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const handleSuccessConfirm = () => {
  successDialog.value = false
  handleReset()
  ElMessage.success('退房完成，欢迎再次光临！')
}
</script>

<style scoped>
.checkout-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

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

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.checkout-card {
  width: 100%;
  max-width: 600px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
}

.card-header {
  font-size: 1.5rem;
  font-weight: bold;
  color: #E6A23C;
}

.checkout-form {
  padding: 20px 0;
}

.password-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

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

@media (max-width: 768px) {
  .checkout-container {
    padding: 10px;
  }
  
  .header h1 {
    font-size: 2rem;
  }
  
  .header p {
    font-size: 1rem;
  }
  
  .checkout-card {
    margin: 0 10px;
  }
}
</style> 