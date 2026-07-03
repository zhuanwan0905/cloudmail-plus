<template>
  <div class="api-key">
    <div class="header-actions">
      <Icon class="icon" icon="ion:add-outline" width="23" height="23" @click="openAdd"/>
      <Icon class="icon" icon="ion:reload" width="18" height="18" @click="refresh"/>
    </div>

    <el-scrollbar class="scrollbar">
      <div class="loading" :class="loading ? 'loading-show' : 'loading-hide'" :style="firstLoad ? 'background: transparent' : ''">
        <loading/>
      </div>
      <div class="key-box">
        <div class="key-item" v-for="item in keyData">
          <div class="key-info">
            <div class="info-left">
              <div class="info-left-item">
                <span class="key-name">{{ item.name }}</span>
              </div>
              <div class="info-left-item">
                <span class="key-masked">{{ maskKey(item.key) }}</span>
              </div>
              <div class="info-left-item">
                <div>{{ $t('apiKeyStatus') }}：</div>
                <el-tag v-if="item.status === 0" type="success">{{ $t('apiKeyActive') }}</el-tag>
                <el-tag v-else type="danger">{{ $t('apiKeyExpired') }}</el-tag>
              </div>
              <div class="info-left-item">
                <div>{{ $t('createTime') }}：</div>
                <div>{{ formatTime(item.createTime) }}</div>
              </div>
              <div class="info-left-item" v-if="item.expireTime">
                <div>{{ $t('apiKeyExpireTime') }}：</div>
                <div>{{ formatTime(item.expireTime) }}</div>
              </div>
            </div>
            <div class="info-right">
              <el-dropdown class="setting">
                <Icon icon="fluent:settings-24-filled" width="21" height="21" color="#909399"/>
                <template #dropdown>
                  <el-dropdown-item @click="copyKey(item.key)">{{ $t('copy') }}</el-dropdown-item>
                  <el-dropdown-item @click="deleteApiKey(item)">{{ $t('delete') }}</el-dropdown-item>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
      <div class="empty" v-if="keyData.length === 0">
        <el-empty v-if="!firstLoad" :image-size="isMobile ? 120 : null" :description="$t('noApiKeyFound')"/>
      </div>
    </el-scrollbar>

    <!-- 创建对话框 -->
    <el-dialog v-model="showAdd" :title="$t('createApiKey')">
      <div class="container">
        <el-input v-model="addForm.name" :placeholder="$t('apiKeyNameDesc')"/>
        <el-date-picker
            v-model="addForm.expireTime"
            type="datetime"
            :placeholder="$t('apiKeyExpireTime')"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
        />
        <el-button class="btn" type="primary" @click="submit" :loading="addLoading"
        >{{ $t('add') }}
        </el-button>
      </div>
    </el-dialog>

    <!-- 密钥展示对话框（创建成功后仅一次） -->
    <el-dialog v-model="showKeyReveal" :title="$t('apiKeyCreatedTitle')" :close-on-click-modal="false">
      <div class="reveal-container">
        <el-alert
            :title="$t('apiKeyCreatedWarning')"
            type="warning"
            show-icon
            :closable="false"
        />
        <div class="reveal-key-box">
          <div class="reveal-key-text">{{ createdKey }}</div>
        </div>
        <el-button class="btn" type="primary" @click="copyAndClose">
          {{ $t('copyAndClose') }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import {defineOptions, reactive, ref} from "vue"
import {Icon} from "@iconify/vue";
import loading from "@/components/loading/index.vue";
import {useSettingStore} from "@/store/setting.js";
import {apiKeyCreate, apiKeyDelete, apiKeyList} from "@/request/api-key.js";
import dayjs from "dayjs";
import {tzDayjs} from "@/utils/day.js";
import {useI18n} from "vue-i18n";

defineOptions({
  name: 'api-key'
})

const settingStore = useSettingStore();
const {t} = useI18n()

const keyData = reactive([])
const loadingFlag = ref(true)
const firstLoad = ref(true)
const showAdd = ref(false)
const addLoading = ref(false)
const showKeyReveal = ref(false)
const createdKey = ref('')
const isMobile = window.innerWidth < 1025

const addForm = reactive({
  name: '',
  expireTime: null
})

getList(true)

function getList(showLoading = false) {
  if (showLoading) {
    loadingFlag.value = true
  }
  apiKeyList().then(list => {
    keyData.length = 0
    keyData.push(...list)
    loadingFlag.value = false
    setTimeout(() => {
      firstLoad.value = false
    }, 200)
  })
}

function refresh() {
  getList(true)
}

function maskKey(key) {
  if (!key) return ''
  if (key.length <= 8) return '****'
  return key.substring(0, 6) + '****' + key.substring(key.length - 4)
}

function formatTime(time) {
  if (!time) return ''
  const t = tzDayjs(time)
  const currentYear = dayjs().year()
  const timeYear = t.year()

  if (settingStore.lang === 'en') {
    return timeYear === currentYear
        ? t.format('MMM D, HH:mm')
        : t.format('MMM D, YYYY HH:mm')
  } else {
    return timeYear === currentYear
        ? t.format('M月D日 HH:mm')
        : t.format('YYYY年M月D日 HH:mm')
  }
}

async function copyKey(code) {
  try {
    await navigator.clipboard.writeText(code);
    ElMessage({
      message: t('copySuccessMsg'),
      type: 'success',
      plain: true,
    })
  } catch (err) {
    console.error('复制失败:', err);
    ElMessage({
      message: t('copyFail'),
      type: 'error',
      plain: true,
    })
  }
}

function openAdd() {
  addForm.name = ''
  addForm.expireTime = null
  showAdd.value = true
}

function submit() {

  if (!addForm.name) {
    ElMessage({
      message: t('emptyApiKeyName'),
      type: "error",
      plain: true
    })
    return
  }

  addLoading.value = true
  apiKeyCreate(addForm).then((data) => {
    showAdd.value = false
    createdKey.value = data.key
    showKeyReveal.value = true
    getList()
  }).finally(() => {
    addLoading.value = false
  })
}

async function copyAndClose() {
  try {
    await navigator.clipboard.writeText(createdKey.value);
    ElMessage({
      message: t('copySuccessMsg'),
      type: 'success',
      plain: true,
    })
  } catch (err) {
    console.error('复制失败:', err);
  }
  showKeyReveal.value = false
}

function deleteApiKey(item) {
  ElMessageBox.confirm(t('apiKeyDeleteConfirm', {msg: item.name}), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    apiKeyDelete(item.apiKeyId).then(() => {
      getList()
      ElMessage({
        message: t('delSuccessMsg'),
        type: "success",
        plain: true
      })
    })
  });
}

</script>

<style scoped lang="scss">
.api-key {
  height: 100%;
  overflow: hidden;
}

.scrollbar {
  height: calc(100% - 48px);
  position: relative;
  background: var(--extra-light-fill);
  @media (max-width: 372px) {
    height: calc(100% - 85px);
  }

  .key-box {
    padding: 15px 15px 25px 15px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 15px;

    .key-item {
      background: var(--el-bg-color);
      border-radius: 8px;
      border: 1px solid var(--el-border-color);
      transition: all 200ms;
      padding: 15px;

      .key-info {
        display: flex;

        .info-left {
          flex: 1;
          min-width: 0;

          .info-left-item {
            display: flex;
            padding-top: 5px;

            .key-name {
              font-weight: bold;
              font-size: 16px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .key-masked {
              font-family: monospace;
              color: #909399;
              font-size: 13px;
            }
          }

          .info-left-item:first-child {
            padding-top: 0;
          }
        }

        .info-right {
          display: flex;
          flex-direction: column;
          padding-top: 2px;
          gap: 5px;
        }
      }
    }
  }
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.loading {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--loadding-background);
  z-index: 2;
}

.loading-show {
  transition: all 200ms ease 200ms;
  opacity: 1;
}

.loading-hide {
  pointer-events: none;
  transition: var(--loading-hide-transition);
  opacity: 0;
}

.container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

:deep(.el-dialog) {
  width: 400px !important;
  @media (max-width: 440px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

.setting {
  cursor: pointer;
}

.header-actions {
  padding: 9px 15px;
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  align-items: center;
  box-shadow: inset 0 -1px 0 0 rgba(100, 121, 143, 0.12);
  font-size: 18px;
  @media (max-width: 767px) {
    gap: 15px;
  }

  .icon {
    cursor: pointer;
  }
}

.reveal-container {
  display: flex;
  flex-direction: column;
  gap: 15px;

  .reveal-key-box {
    background: #f5f7fa;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    padding: 15px;
    text-align: center;

    .reveal-key-text {
      font-family: monospace;
      font-size: 16px;
      font-weight: bold;
      color: #303133;
      word-break: break-all;
      user-select: all;
    }
  }
}
</style>
