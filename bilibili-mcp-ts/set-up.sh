#!/bin/bash

# B站 MCP Server - 快速安装脚本

set -e

echo "🚀 B站 MCP Server 安装脚本"
echo "================================"

# 1. 检查 Node.js
echo "📋 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装 Node.js >= 20"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 版本过低，需要 >= 20，当前: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version)"

# 2. 检查包管理器
if command -v bun &> /dev/null; then
    PKG_MANAGER="bun"
    echo "✅ 使用 Bun 包管理器"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    echo "✅ 使用 npm 包管理器"
else
    echo "❌ 未找到包管理器（npm 或 bun）"
    exit 1
fi

# 3. 安装依赖
echo ""
echo "📦 安装依赖..."
$PKG_MANAGER install

# 4. 编译
echo ""
echo "🔨 编译项目..."
$PKG_MANAGER run build

# 5. 运行测试
echo ""
echo "🧪 运行测试..."
if $PKG_MANAGER run test; then
    echo "✅ 所有测试通过"
else
    echo "⚠️  部分测试失败，请检查配置"
fi

# 6. 显示配置示例
echo ""
echo "🎉 安装完成！"
echo "================================"
echo ""
echo "📖 快速开始:"
echo ""
echo "1. 开发模式:"
echo "   $PKG_MANAGER run dev"
echo ""
echo "2. 生产模式:"
echo "   $PKG_MANAGER start"
echo ""
echo "3. 调试工具:"
echo "   $PKG_MANAGER run inspector"
echo ""
echo "4. 运行示例:"
echo "   tsx examples/simple.ts"
echo ""
echo "🛠️  AI 工具配置 (Trae/Cursor):"
echo ""
cat << 'EOF'
{
  "mcpServers": {
    "bilibili-search": {
      "command": "node",
      "args": ["$(pwd)/dist/index.js"],
      "description": "B站视频搜索 MCP 服务"
    }
  }
}
EOF

echo ""
echo "📚 更多信息请查看 README.md"
echo ""
