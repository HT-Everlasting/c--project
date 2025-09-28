<template>
  <div class="statistics-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>数据统计与可视化</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :clearable="false"
            style="margin-left: 24px;"
            @change="fetchAll"
          />
        </div>
      </template>
      <el-row :gutter="24">
        <el-col :xs="24" :md="12">
          <div class="chart-title">入住率</div>
          <div ref="occupancyChart" class="chart-box"></div>
          <el-table :data="occupancyData" size="small" style="margin-top: 10px;">
            <el-table-column prop="period" label="日期" />
            <el-table-column prop="count" label="入住数" />
          </el-table>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="chart-title">营收统计</div>
          <div ref="revenueChart" class="chart-box"></div>
          <el-table :data="revenueData" size="small" style="margin-top: 10px;">
            <el-table-column prop="period" label="日期" />
            <el-table-column prop="revenue" label="营收(元)" />
          </el-table>
        </el-col>
      </el-row>
      <el-row :gutter="24" style="margin-top: 32px;">
        <el-col :xs="24" :md="12">
          <div class="chart-title">房型分布</div>
          <div ref="roomTypeChart" class="chart-box"></div>
          <el-table :data="roomTypeData" size="small" style="margin-top: 10px;">
            <el-table-column prop="room_type" label="房型" />
            <el-table-column prop="count" label="数量" />
          </el-table>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="chart-title">客源地分布</div>
          <div ref="guestOriginChart" class="chart-box"></div>
          <el-table :data="guestOriginData" size="small" style="margin-top: 10px;">
            <el-table-column prop="province" label="省份" />
            <el-table-column prop="count" label="人数" />
          </el-table>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const dateRange = ref([
  new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  new Date().toISOString().slice(0, 10)
]);

const occupancyChart = ref();
const revenueChart = ref();
const roomTypeChart = ref();
const guestOriginChart = ref();

const occupancyData = ref<any[]>([]);
const revenueData = ref<any[]>([]);
const roomTypeData = ref<any[]>([]);
const guestOriginData = ref<any[]>([]);

const fetchAll = async () => {
  await Promise.all([
    fetchOccupancyRate(),
    fetchRevenue(),
    fetchRoomType(),
    fetchGuestOrigin()
  ]);
};

const fetchOccupancyRate = async () => {
  try {
    const [start, end] = dateRange.value;
    const res = await axios.get('/api/statistics/occupancy-rate', {
      params: { start, end, type: 'day' }
    });
    if (res.data.success) {
      occupancyData.value = res.data.data;
      renderOccupancyChart(res.data.data);
    }
  } catch {
    ElMessage.error('获取入住率失败');
  }
};

const fetchRevenue = async () => {
  try {
    const [start, end] = dateRange.value;
    const res = await axios.get('/api/statistics/revenue', {
      params: { start, end, type: 'day' }
    });
    if (res.data.success) {
      revenueData.value = res.data.data;
      renderRevenueChart(res.data.data);
    }
  } catch {
    ElMessage.error('获取营收失败');
  }
};

const fetchRoomType = async () => {
  try {
    const res = await axios.get('/api/statistics/room-type-distribution');
    if (res.data.success) {
      roomTypeData.value = res.data.data;
      renderRoomTypeChart(res.data.data);
    }
  } catch {
    ElMessage.error('获取房型分布失败');
  }
};

const fetchGuestOrigin = async () => {
  try {
    const res = await axios.get('/api/statistics/guest-origin');
    if (res.data.success) {
      guestOriginData.value = res.data.data;
      renderGuestOriginChart(res.data.data);
    }
  } catch {
    ElMessage.error('获取客源地分布失败');
  }
};

function renderOccupancyChart(data: any[]) {
  const chart = echarts.init(occupancyChart.value);
  const xData = data.map(item => item.period);
  const yData = data.map(item => item.count);
  chart.setOption({
    title: { text: '', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: xData },
    yAxis: { type: 'value', name: '入住数' },
    series: [{ type: 'line', data: yData, smooth: true, areaStyle: {} }]
  });
}

function renderRevenueChart(data: any[]) {
  const chart = echarts.init(revenueChart.value);
  const xData = data.map(item => item.period);
  const yData = data.map(item => item.revenue);
  chart.setOption({
    title: { text: '', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: xData },
    yAxis: { type: 'value', name: '营收(元)' },
    series: [{ type: 'bar', data: yData, itemStyle: { color: '#409EFF' } }]
  });
}

function renderRoomTypeChart(data: any[]) {
  const chart = echarts.init(roomTypeChart.value);
  chart.setOption({
    title: { text: '', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: { show: true, formatter: '{b}: {d}%' },
      data: data.map(item => ({ name: item.room_type, value: item.count }))
    }]
  });
}

function renderGuestOriginChart(data: any[]) {
  const chart = echarts.init(guestOriginChart.value);
  chart.setOption({
    title: { text: '', left: 'center' },
    tooltip: { trigger: 'item' },
    xAxis: { type: 'category', data: data.map(item => item.province) },
    yAxis: { type: 'value', name: '人数' },
    series: [{ type: 'bar', data: data.map(item => item.count), itemStyle: { color: '#67C23A' } }]
  });
}

onMounted(() => {
  fetchAll();
});

watch(dateRange, fetchAll);
</script>

<style scoped>
.statistics-container {
  padding: 20px;
  background: #f5f7fa;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
}
.chart-title {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 8px;
}
.chart-box {
  width: 100%;
  height: 320px;
  background: #fff;
  border-radius: 8px;
}
</style> 