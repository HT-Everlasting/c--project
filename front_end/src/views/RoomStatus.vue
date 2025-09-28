<template>
  <div class="room-status-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>房间状态总览</span>
          <el-input
            v-model="searchQuery"
            placeholder="按房间号搜索..."
            class="search-input"
            clearable
          />
        </div>
      </template>

      <el-tabs v-model="activeTab" class="status-tabs">
        <el-tab-pane
          v-for="tab in tabs"
          :key="tab.name"
          :label="tab.label"
          :name="tab.name"
        >
          <template #label>
            <span>{{ tab.label }}</span>
            <el-badge :value="getRoomCountByStatus(tab.name)" class="tab-badge" />
          </template>
        </el-tab-pane>
      </el-tabs>

      <el-scrollbar height="calc(100vh - 280px)">
        <div v-if="filteredRooms.length > 0" class="room-grid">
          <el-row :gutter="20">
            <el-col
              v-for="room in filteredRooms"
              :key="room.id"
              :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
            >
              <el-card :class="['room-card', getStatusClass(room.status)]" shadow="hover">
                <div class="room-number">{{ room.room_number }}</div>
                <div class="room-type">{{ room.room_type }}</div>
                <div class="room-status">
                  <el-tag :type="getStatusTagType(room.status)" effect="dark" size="small">{{ room.status }}</el-tag>
                </div>
                <div class="room-price">¥{{ room.price }} / 晚</div>
              </el-card>
            </el-col>
          </el-row>
        </div>
        <el-empty v-else description="暂无该状态的房间" />
      </el-scrollbar>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { ElMessage } from 'element-plus';

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  floor: number;
  price: string;
  status: '空闲' | '已预订' | '已入住' | '维护中';
}

const allRooms = ref<Room[]>([]);
const searchQuery = ref('');
const activeTab = ref('all');
let socket: Socket;

const tabs = [
  { name: 'all', label: '全部' },
  { name: '空闲', label: '空闲' },
  { name: '已入住', label: '已入住' },
  { name: '已预订', label: '已预订' },
  { name: '维护中', label: '维护中' },
];

const filteredRooms = computed(() => {
  return allRooms.value.filter(room => {
    const matchesTab = activeTab.value === 'all' || room.status === activeTab.value;
    const matchesSearch = room.room_number.includes(searchQuery.value);
    return matchesTab && matchesSearch;
  });
});

const getRoomCountByStatus = (status: string) => {
  if (status === 'all') return allRooms.value.length;
  return allRooms.value.filter(room => room.status === status).length;
};

const getStatusClass = (status: Room['status']) => {
  return {
    'status-available': status === '空闲',
    'status-occupied': status === '已入住',
    'status-booked': status === '已预订',
    'status-maintenance': status === '维护中',
  };
};

const getStatusTagType = (status: Room['status']) => {
  switch (status) {
    case '空闲': return 'success';
    case '已入住': return 'warning';
    case '已预订': return 'primary';
    case '维护中': return 'info';
    default: return '';
  }
};

const fetchRooms = async () => {
  try {
    const response = await axios.get('/api/rooms');
    if (response.data.success) {
      allRooms.value = response.data.data;
    } else {
      ElMessage.error('获取房间列表失败');
    }
  } catch (error) {
    ElMessage.error('网络错误，无法获取房间列表');
  }
};

onMounted(() => {
  fetchRooms();

  socket = io('http://localhost:5000');

  socket.on('connect', () => {
    console.log('Socket.IO connected');
  });

  socket.on('room_status_changed', (updatedRoom: Room) => {
    const index = allRooms.value.findIndex(room => room.id === updatedRoom.id);
    if (index !== -1) {
      allRooms.value[index] = updatedRoom;
      ElMessage.success(`房间 ${updatedRoom.room_number} 状态已更新为 ${updatedRoom.status}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket.IO disconnected');
  });
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
});
</script>

<style scoped>
.room-status-container {
  padding: 20px;
  background-color: #f5f7fa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-input {
  width: 250px;
}

.status-tabs .tab-badge {
  margin-left: 8px;
  transform: translateY(-2px);
}

.room-grid {
  padding: 10px;
}

.room-card {
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  border-left-width: 5px;
  border-left-style: solid;
}

.room-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.status-available { border-color: #67c23a; }
.status-occupied { border-color: #e6a23c; }
.status-booked { border-color: #409eff; }
.status-maintenance { border-color: #909399; }

.room-number {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 8px;
}

.room-type {
  font-size: 0.9rem;
  color: #606266;
  margin-bottom: 12px;
}

.room-status {
  margin-bottom: 12px;
}

.room-price {
  font-size: 1.1rem;
  font-weight: 500;
  color: #f56c6c;
}

.el-empty {
  margin-top: 50px;
}
</style> 