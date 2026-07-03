# Cloud Mail API 文档

基于 Cloud Mail 邮件系统的开放 API，支持通过 API 密钥创建邮箱、收发邮件等操作。

---

## 目录

- [快速开始](#快速开始)
- [认证方式](#认证方式)
- [API 密钥管理](#api-密钥管理)
- [邮箱管理 API](#邮箱管理-api)
- [邮件 API](#邮件-api)
- [错误码](#错误码)

---

## 快速开始

### 请求格式

- **Base URL**：`https://your-domain.com/api`
- **内容类型**：`application/json`
- **响应格式**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {}
  }
  ```

### 认证

除 API 密钥管理接口使用 JWT Token（与 Web 端相同）外，所有 `/v1/*` 接口使用 `X-Api-Key` 请求头认证：

```
X-Api-Key: cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 认证方式

### 管理端认证（API 密钥管理）

API 密钥的管理接口（`/apiKey/*`）使用与 Web 后台相同的 JWT 认证方式：

```
Authorization: Bearer <jwt_token>
```

### API 调用认证（邮件操作）

所有邮件操作接口（`/v1/*`）使用 API 密钥认证：

```
X-Api-Key: <api_key>
```

---

## API 密钥管理

API 密钥用于外部程序调用邮件 API。每个 API 密钥绑定到一个用户，可以通过该密钥为该用户创建无限个邮箱。

> **注意**：以下接口需要管理员或具有相应权限的用户通过 JWT Token 调用。

### 创建 API 密钥

```
POST /apiKey/create
```

**请求头**：
```
Authorization: Bearer <jwt_token>
```

**请求参数**（JSON Body）：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 密钥名称，用于标识用途 |
| expireTime | string | 否 | 过期时间，格式 `YYYY-MM-DD HH:mm:ss`，不传则永不过期 |

**请求示例**：
```json
{
  "name": "自动化脚本密钥",
  "expireTime": "2026-12-31 23:59:59"
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "key": "cm_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "name": "自动化脚本密钥"
  }
}
```

> **重要**：`key` 仅在创建时返回一次，请妥善保管。

---

### 查看 API 密钥列表

```
GET /apiKey/list
```

**请求头**：
```
Authorization: Bearer <jwt_token>
```

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "apiKeyId": 1,
      "key": "cm_a1b2c3d4...",
      "name": "自动化脚本密钥",
      "userId": 5,
      "userEmail": "admin@example.com",
      "status": 0,
      "expireTime": "2026-12-31 23:59:59",
      "createTime": "2026-07-03 10:00:00"
    }
  ]
}
```

---

### 删除 API 密钥

```
DELETE /apiKey/delete?apiKeyIds=1,2,3
```

**请求头**：
```
Authorization: Bearer <jwt_token>
```

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| apiKeyIds | string | 是 | 要删除的密钥 ID，多个用逗号分隔 |

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 邮箱管理 API

以下接口使用 `X-Api-Key` 认证。

### 创建邮箱

通过 API 密钥创建新邮箱地址。

```
POST /v1/mailbox/create
```

**请求头**：
```
X-Api-Key: cm_xxxxxxxxxxxx
Content-Type: application/json
```

**请求参数**（JSON Body）：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 要创建的完整邮箱地址，如 `test@nmlgb.cyou` |

**请求示例**：
```json
{
  "email": "myapp@nmlgb.cyou"
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "accountId": 42,
    "email": "myapp@nmlgb.cyou",
    "name": "myapp",
    "userId": 5,
    "status": 0,
    "createTime": "2026-07-03 10:30:00"
  }
}
```

---

### 查看邮箱列表

获取 API 密钥所关联用户的所有邮箱。

```
GET /v1/mailbox/list
```

**请求头**：
```
X-Api-Key: cm_xxxxxxxxxxxx
```

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| accountId | number | 否 | 分页偏移（游标），首次不传 |
| size | number | 否 | 每页数量，默认 30，最大 50 |
| lastSort | number | 否 | 分页排序值 |

**请求示例**：
```
GET /v1/mailbox/list?size=20
```

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "accountId": 42,
        "email": "myapp@nmlgb.cyou",
        "name": "myapp",
        "status": 0,
        "latestEmailTime": "2026-07-03 09:15:00",
        "createTime": "2026-07-03 10:30:00"
      }
    ],
    "total": 1
  }
}
```

---

### 查看邮箱详情

获取单个邮箱的详细信息和收件统计。

```
GET /v1/mailbox/info?accountId=42
```

**请求头**：
```
X-Api-Key: cm_xxxxxxxxxxxx
```

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| accountId | number | 是 | 邮箱 ID |

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "accountId": 42,
    "email": "myapp@nmlgb.cyou",
    "name": "myapp",
    "status": 0,
    "createTime": "2026-07-03 10:30:00",
    "latestEmailTime": "2026-07-03 09:15:00",
    "receiveCount": 156
  }
}
```

---

### 删除邮箱

```
DELETE /v1/mailbox/delete?accountId=42
```

**请求头**：
```
X-Api-Key: cm_xxxxxxxxxxxx
```

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| accountId | number | 是 | 邮箱 ID |

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 邮件 API

### 获取邮件列表

获取指定邮箱的收件箱或发件箱邮件列表。

```
GET /v1/email/list
```

**请求头**：
```
X-Api-Key: cm_xxxxxxxxxxxx
```

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| accountId | number | 是 | 邮箱 ID |
| type | number | 否 | 邮件类型：`0`=收件，`1`=发件，不传则返回所有 |
| emailId | number | 否 | 分页游标，首次不传 |
| size | number | 否 | 每页数量，默认 30，最大 50 |
| timeSort | number | 否 | 排序方向：`1`=正序（旧→新），`0`/不传=倒序（新→旧） |

**请求示例**：
```
GET /v1/email/list?accountId=42&type=0&size=20
```

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "emailId": 1001,
        "sendEmail": "sender@example.com",
        "name": "张三",
        "subject": "关于合作的事项",
        "toEmail": "myapp@nmlgb.cyou",
        "toName": "myapp",
        "type": 0,
        "status": 0,
        "unread": 0,
        "createTime": "2026-07-03 09:15:00",
        "content": "<html>...邮件内容...</html>",
        "text": "邮件纯文本内容",
        "attList": []
      }
    ],
    "total": 156
  }
}
```

---

### 获取邮件详情

```
GET /v1/email/detail?emailId=1001
```

**请求头**：
```
X-Api-Key: cm_xxxxxxxxxxxx
```

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| emailId | number | 是 | 邮件 ID |

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "emailId": 1001,
    "sendEmail": "sender@example.com",
    "name": "张三",
    "subject": "关于合作的事项",
    "toEmail": "myapp@nmlgb.cyou",
    "toName": "myapp",
    "type": 0,
    "status": 0,
    "content": "<html>...完整邮件内容...</html>",
    "text": "邮件纯文本内容",
    "cc": "[]",
    "bcc": "[]",
    "recipient": "[{\"address\":\"myapp@nmlgb.cyou\",\"name\":\"\"}]",
    "messageId": "<abc123@mail.example.com>",
    "createTime": "2026-07-03 09:15:00",
    "attList": [
      {
        "attId": 50,
        "filename": "合同.pdf",
        "size": 102400,
        "key": "attachments/abc123.pdf",
        "type": 0
      }
    ]
  }
}
```

---

### 发送邮件

通过指定邮箱账号发送邮件。**发送时会自动在邮件正文前添加标识行**：

```
接收：recipient@example.com  发送人：sender@nmlgb.cyou
```

```
POST /v1/email/send
```

**请求头**：
```
X-Api-Key: cm_xxxxxxxxxxxx
Content-Type: application/json
```

**请求参数**（JSON Body）：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| accountId | number | 是 | 发件邮箱 ID |
| receiveEmail | string[] | 是 | 收件人邮箱地址列表 |
| subject | string | 是 | 邮件主题 |
| content | string | 否 | 邮件 HTML 正文 |
| text | string | 否 | 邮件纯文本正文 |
| name | string | 否 | 发件人显示名称，不传则使用邮箱前缀 |
| attachments | object[] | 否 | 附件列表 |
| sendType | string | 否 | 发送类型：`new`=新邮件，`reply`=回复 |
| emailId | number | 否 | 回复邮件时使用，被回复邮件的 ID |

**附件对象格式**：
```json
{
  "filename": "file.pdf",
  "content": "base64编码内容",
  "contentType": "application/pdf"
}
```

**请求示例**：
```json
{
  "accountId": 42,
  "receiveEmail": ["user@example.com"],
  "subject": "测试邮件",
  "content": "<h1>你好</h1><p>这是一封测试邮件</p>",
  "text": "你好，这是一封测试邮件"
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "emailId": 1002,
    "sendEmail": "myapp@nmlgb.cyou",
    "name": "myapp",
    "subject": "测试邮件",
    "type": 1,
    "status": 1,
    "createTime": "2026-07-03 10:45:00"
  }
}
```

> **邮件标识说明**：发送邮件时，系统会自动在正文前添加 `接收：收件人地址  发送人：发件人地址` 格式的标识行，便于区分是哪个邮箱发出的邮件。

---

### 删除邮件

```
DELETE /v1/email/delete?emailIds=1001,1002
```

**请求头**：
```
X-Api-Key: cm_xxxxxxxxxxxx
```

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| emailIds | string | 是 | 邮件 ID 列表，多个用逗号分隔 |

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 401 | 认证失败：API 密钥缺失、无效或已过期 |
| 403 | 权限不足 |
| 500 | 服务器内部错误 |
| 501 | 业务逻辑错误（具体信息见 message 字段） |

**错误响应示例**：
```json
{
  "code": 401,
  "message": "API 密钥无效或已过期",
  "data": null
}
```

---

## 使用示例

### Python 示例

```python
import requests

BASE_URL = "https://your-domain.com/api"
API_KEY = "cm_your_api_key_here"

headers = {"X-Api-Key": API_KEY, "Content-Type": "application/json"}

# 创建邮箱
r = requests.post(f"{BASE_URL}/v1/mailbox/create", json={"email": "test@nmlgb.cyou"}, headers=headers)
print(r.json())

# 查看邮箱列表
r = requests.get(f"{BASE_URL}/v1/mailbox/list", headers=headers)
print(r.json())

# 获取收件箱邮件
r = requests.get(f"{BASE_URL}/v1/email/list", params={"accountId": 42, "type": 0}, headers=headers)
print(r.json())

# 发送邮件
r = requests.post(f"{BASE_URL}/v1/email/send", json={
    "accountId": 42,
    "receiveEmail": ["user@example.com"],
    "subject": "API 测试邮件",
    "text": "这是一封通过 API 发送的测试邮件"
}, headers=headers)
print(r.json())
```

### cURL 示例

```bash
# 创建邮箱
curl -X POST https://your-domain.com/api/v1/mailbox/create \
  -H "X-Api-Key: cm_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@nmlgb.cyou"}'

# 获取邮件列表
curl "https://your-domain.com/api/v1/email/list?accountId=42&type=0&size=10" \
  -H "X-Api-Key: cm_your_api_key_here"

# 发送邮件
curl -X POST https://your-domain.com/api/v1/email/send \
  -H "X-Api-Key: cm_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": 42,
    "receiveEmail": ["user@example.com"],
    "subject": "Hello from API",
    "text": "This is a test email"
  }'
```
