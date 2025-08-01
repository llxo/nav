# 使用官方的 Node.js 18 Alpine 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用程序源代码
COPY . .

# 创建数据库目录
RUN mkdir -p /app/data

# 添加启动脚本权限
RUN chmod +x /app/docker-entrypoint.sh

# 暴露端口
EXPOSE 721

# 设置环境变量
ENV NODE_ENV=production
ENV DOCKER_ENV=true

# 使用自定义入口点来验证环境变量
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# 启动应用程序
CMD ["npm", "start"]
