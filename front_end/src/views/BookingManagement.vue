<template>
  <div class="booking-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>预订信息管理</span>
          <el-button type="primary" :icon="Refresh" @click="fetchBookings" :loading="loading">
            刷新
          </el-button>
        </div>
      </template>

      <el-table :data="bookings" v-loading="loading" style="width: 100%">
        <el-table-column prop="booking_id" label="预订ID" width="80" />
        <el-table-column prop="guest_name" label="客人姓名" width="120" />
        <el-table-column prop="room_number" label="房间号" width="100" />
        <el-table-column prop="room_type" label="房间类型" width="120" />
        <el-table-column prop="check_in_date" label="入住日期" width="120" />
        <el-table-column prop="check_out_date" label="退房日期" width="120" />
        <el-table-column prop="booking_status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.booking_status)">
              {{ scope.row.booking_status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="booking_time" label="预订时间" width="180">
           <template #default="scope">
            {{ formatDateTime(scope.row.booking_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleView(scope.row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

interface Booking {
  booking_id: number;
  guest_name: string;
  room_number: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
  booking_status: string;
  booking_time: string;
}

const bookings = ref<Booking[]>([]);
const loading = ref(false);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
});

const fetchBookings = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/bookings', {
      params: {
        page: pagination.value.page,
        limit: pagination.value.limit,
      },
    });
    if (response.data.success) {
      bookings.value = response.data.data.bookings;
      pagination.value.total = response.data.data.pagination.total;
    } else {
      ElMessage.error(response.data.message || '获取预订列表失败');
    }
  } catch (error) {
    ElMessage.error('网络错误或服务器无法响应');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchBookings();
});

const getStatusType = (status: string) => {
  switch (status) {
    case '已入住': return 'success';
    case '已预订': return 'warning';
    case '已退房': return 'info';
    case '已取消': return 'danger';
    default: return 'primary';
  }
};

const formatDateTime = (time: string) => {
  if (!time) return '';
  return new Date(time).toLocaleString();
};

const handleView = (row: Booking) => {
  ElMessageBox.alert(
    `<p><strong>客人姓名:</strong> ${row.guest_name}</p>
     <p><strong>房间号:</strong> ${row.room_number}</p>
     <p><strong>入住日期:</strong> ${row.check_in_date}</p>
     <p><strong>退房日期:</strong> ${row.check_out_date}</p>`,
    '预订详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭',
    }
  );
};

const handleSizeChange = (val: number) => {
  pagination.value.limit = val;
  fetchBookings();
};

const handleCurrentChange = (val: number) => {
  pagination.value.page = val;
  fetchBookings();
};
</script>

<style scoped>
.booking-management-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style> 