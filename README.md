# Smart Price AI - 智能定价系统部署指南

本指南将指导您如何在阿里云服务器（ECS）上部署本项目，并通过公网 IP 进行访问。

## 1. 服务器环境准备

建议使用 **Ubuntu 20.04/22.04** 或 **CentOS 7+** 系统。

### 安装 Node.js
本项目需要 Node.js 环境（推荐 v18 或更高版本）。

**Ubuntu/Debian:**
```bash
# 更新包索引
sudo apt update

# 安装 Node.js (使用 NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

**CentOS/RHEL:**
```bash
# 安装 Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

---

## 2. 项目上传与安装

1. **上传代码**: 将项目文件上传至服务器（可以使用 `git clone` 或 FTP/SCP 工具）。
2. **进入目录**:
   ```bash
   cd /path/to/your/project
   ```
3. **安装依赖**:
   ```bash
   npm install
   ```

---

## 3. 运行项目

### 方式 A: 开发模式 (测试用)
开发模式支持热更新，适合调试。

1. **启动服务**:
   ```bash
   npm run dev
   ```
   *注意：`vite.config.ts` 中已配置 `host: '0.0.0.0'`，允许外部访问。*

2. **默认端口**: 5173

### 方式 B: 生产环境部署 (正式使用推荐)
生产模式性能更好，体积更小。

1. **构建项目**:
   ```bash
   npm run build
   ```
   构建完成后会生成 `dist` 目录。

2. **运行静态服务**:
   推荐使用轻量级服务器 `serve`。

   ```bash
   # 全局安装 serve
   sudo npm install -g serve

   # 在后台启动服务 (运行在 3000 端口)
   nohup serve -s dist -l 3000 > serve.log 2>&1 &
   ```

---

## 4. 阿里云安全组配置 (关键步骤)

**如果不配置此步骤，您将无法通过公网 IP 访问网页。**

1. 登录 [阿里云 ECS 控制台](https://ecs.console.aliyun.com)。
2. 找到您的实例，点击 **实例 ID** 进入详情页。
3. 点击选项卡中的 **安全组**，然后点击安全组 ID。
4. 点击 **入方向** -> **手动添加**。
5. 填写入方向规则：
   - **授权策略**: 允许
   - **优先级**: 1
   - **协议类型**: TCP (自定义 TCP)
   - **端口范围**: 
     - 如果是开发模式: 填写 `5173/5173`
     - 如果是生产模式(`serve`): 填写 `3000/3000` (或您指定的其他端口)
   - **授权对象 (源 IP)**: `0.0.0.0/0` (允许所有 IP 访问)
6. 点击 **保存**。

---

## 5. 访问应用

1. 获取服务器的 **公网 IP (Public IP)**。
2. 在浏览器地址栏输入：
   ```
   http://<您的公网IP>:<端口号>
   ```
   
   例如：
   - 开发模式: `http://123.123.123.123:5173`
   - 生产模式: `http://123.123.123.123:3000`

---

## 6. 常见问题排查

**Q: 浏览器一直转圈，无法连接？**
*   **检查安全组**: 确认阿里云安全组入方向规则已放行对应端口。
*   **检查防火墙**: 服务器内部防火墙可能拦截了连接。
    *   Ubuntu (`ufw`): `sudo ufw allow 3000`
    *   CentOS (`firewalld`): 
        ```bash
        sudo firewall-cmd --zone=public --add-port=3000/tcp --permanent
        sudo firewall-cmd --reload
        ```

**Q: 控制台显示 Network: http://172.x.x.x:xxxx ?**
*   这是服务器的内网 IP。只要您在阿里云安全组配置正确，使用**公网 IP** 依然可以从外部访问。
