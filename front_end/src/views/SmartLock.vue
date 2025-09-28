<template>
  <div class="smart-lock-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>智能锁管理</span>
          <el-input
            v-model="searchQuery"
            placeholder="按房间号搜索..."
            class="search-input"
            clearable
          />
          <el-select v-model="filterStatus" placeholder="锁状态筛选" class="status-select" clearable>
            <el-option label="全部" value="all" />
            <el-option label="已设置" value="set" />
            <el-option label="未设置" value="unset" />
          </el-select>
        </div>
      </template>

      <el-table :data="filteredRooms" style="width: 100%" stripe>
        <el-table-column prop="room_number" label="房间号" width="100" />
        <el-table-column prop="room_type" label="房型" width="120" />
        <el-table-column label="智能锁状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.smart_lock_code ? 'success' : 'info'">
              {{ scope.row.smart_lock_code ? '已设置' : '未设置' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              @click="openSetDialog(scope.row)"
            >
              {{ scope.row.smart_lock_code ? '修改密码' : '设置密码' }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              :disabled="!scope.row.smart_lock_code"
              @click="resetLockCode(scope.row)"
            >重置密码</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 设置/修改密码弹窗 -->
    <el-dialog v-model="setDialogVisible" :title="dialogTitle" width="400px" center>
      <el-form :model="setForm" :rules="setRules" ref="setFormRef" label-width="100px">
        <el-form-item label="房间号">
          <el-input v-model="setForm.room_number" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="lockCode">
          <el-input
            v-model="setForm.lockCode"
            maxlength="6"
            show-password
            placeholder="请输入6位数字密码"
            @input="onLockCodeInput"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="setDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="setLoading" @click="submitSetLockCode">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  smart_lock_code: string | null;
}

const allRooms = ref<Room[]>([]);
const searchQuery = ref('');
const filterStatus = ref('all');

const setDialogVisible = ref(false);
const setLoading = ref(false);
const setFormRef = ref();
const setForm = reactive({
  id: 0,
  room_number: '',
  lockCode: '',
  smart_lock_code: null as string | null
});
const setRules = {
  lockCode: [
    { required: true, message: '请输入6位数字密码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '密码必须是6位数字', trigger: 'blur' }
  ]
};
const dialogTitle = computed(() => setForm.smart_lock_code ? '修改智能锁密码' : '设置智能锁密码');

const fetchRooms = async () => {
  try {
    const res = await axios.get('/api/rooms');
    if (res.data.success) {
      allRooms.value = res.data.data;
    } else {
      ElMessage.error('获取房间列表失败');
    }
  } catch {
    ElMessage.error('网络错误，无法获取房间列表');
  }
};

const filteredRooms = computed(() => {
  return allRooms.value.filter(room => {
    const matchSearch = room.room_number.includes(searchQuery.value);
    let matchStatus = true;
    if (filterStatus.value === 'set') matchStatus = !!room.smart_lock_code;
    if (filterStatus.value === 'unset') matchStatus = !room.smart_lock_code;
    return matchSearch && matchStatus;
  });
});

const openSetDialog = (room: Room) => {
  setForm.id = room.id;
  setForm.room_number = room.room_number;
  setForm.lockCode = '';
  setForm.smart_lock_code = room.smart_lock_code;
  setDialogVisible.value = true;
};

const onLockCodeInput = (val: string) => {
  setForm.lockCode = val.replace(/\D/g, '').slice(0, 6);
};

const submitSetLockCode = async () => {
  if (!setFormRef.value) return;
  await setFormRef.value.validate();
  setLoading.value = true;
  try {
    const res = await axios.post(`/api/rooms/${setForm.id}/smart-lock`, {
      lockCode: setForm.lockCode
    });
    if (res.data.success) {
      ElMessage.success('智能锁密码设置成功');
      setDialogVisible.value = false;
      fetchRooms();
    } else {
      ElMessage.error(res.data.message || '设置失败');
    }
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '设置失败');
  } finally {
    setLoading.value = false;
  }
};

const resetLockCode = async (room: Room) => {
  try {
    const res = await axios.delete(`/api/rooms/${room.id}/smart-lock`);
    if (res.data.success) {
      ElMessage.success('密码已重置');
      fetchRooms();
    } else {
      ElMessage.error(res.data.message || '重置失败');
    }
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '重置失败');
  }
};

onMounted(() => {
  fetchRooms();
});
</script>

<style scoped>
.smart-lock-container {
  padding: 20px;
  background: #f5f7fa;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
}
.search-input {
  width: 200px;
}
.status-select {
  width: 120px;
}
</style> 