<template>
  <div class="booking-query-container">
    <div class="header">
      <h1>预订信息查询</h1>
      <p>输入身份证号查询您的预订和入住记录</p>
    </div>

    <div class="main-content">
      <el-card class="query-card">
        <template #header>
          <div class="card-header">
            <span>预订查询</span>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="120px"
          class="query-form"
        >
          <el-form-item label="身份证号" prop="idCard">
            <el-input 
              v-model="form.idCard" 
              placeholder="请输入身份证号" 
              maxlength="18"
              @input="handleIdCardInput"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleQuery" :loading="loading" size="large">
              查询预订
            </el-button>
            <el-button @click="handleReset" size="large">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 查询结果 -->
        <div v-if="bookingList.length > 0" class="query-results">
          <h3>查询结果</h3>
          <el-table :data="bookingList" style="width: 100%">
            <el-table-column prop="guest_name" label="客人姓名" width="120" />
            <el-table-column prop="room_number" label="房间号" width="100" />
            <el-table-column prop="room_type" label="房间类型" width="120" />
            <el-table-column prop="check_in_date" label="入住日期" width="120" />
            <el-table-column prop="check_out_date" label="退房日期" width="120" />
            <el-table-column prop="total_amount" label="总费用" width="100">
              <template #default="scope">
                ¥{{ scope.row.total_amount }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="smart_lock_code" label="智能锁密码" width="120">
              <template #default="scope">
                <span v-if="scope.row.smart_lock_code">{{ scope.row.smart_lock_code }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 响应式数据
const formRef = ref()
const loading = ref(false)
const bookingList = ref([])

// 表单数据
const form = reactive({
  idCard: ''
})

// 表单验证规则
const rules = {
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^\d{17}[\dXx]$/, message: '身份证号格式不正确', trigger: 'blur' }
  ]
}

// 方法
const handleIdCardInput = (value: string) => {
  form.idCard = value.replace(/[^0-9Xx]/g, '').toUpperCase()
}

const getStatusType = (status: string) => {
  switch (status) {
    case '已预订':
      return 'warning'
    case '已入住':
      return 'success'
    case '已退房':
      return 'info'
    case '已取消':
      return 'danger'
    default:
      return 'info'
  }
}

const handleQuery = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const response = await axios.get(`/api/bookings/guest/${form.idCard}`)
    
    if (response.data.success) {
      bookingList.value = response.data.data
      ElMessage.success('查询成功')
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (error: any) {
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('查询失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  bookingList.value = []
}
</script>

<style scoped>
.booking-query-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

.query-card {
  width: 100%;
  max-width: 1000px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
}

.card-header {
  font-size: 1.5rem;
  font-weight: bold;
  color: #409EFF;
}

.query-form {
  padding: 20px 0;
  border-bottom: 1px solid #EBEEF5;
  margin-bottom: 20px;
}

.query-results {
  margin-top: 20px;
}

.query-results h3 {
  color: #409EFF;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .booking-query-container {
    padding: 10px;
  }
  
  .header h1 {
    font-size: 2rem;
  }
  
  .header p {
    font-size: 1rem;
  }
  
  .query-card {
    margin: 0 10px;
  }
}
</style> 