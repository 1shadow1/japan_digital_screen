import React, { useEffect, useRef } from 'react';
import './AIDecisionChat.css';

interface AIMessage {
  id: string;
  timestamp: number;
  type: string;
  icon: string;
  color: string;
  message: string;
  action?: string;
  time: string;
}

interface AIDecisionChatProps {
  messages: AIMessage[];
}

const AIDecisionChat: React.FC<AIDecisionChatProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息（限制在聊天容器内部）
  useEffect(() => {
    if (messagesEndRef.current && containerRef.current) {
      // 只在聊天容器内部滚动，不影响整体页面
      const container = containerRef.current;
      const element = messagesEndRef.current;
      
      // 计算需要滚动的距离
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      const elementTop = element.offsetTop;
      
      // 只有当新消息不在可见区域时才滚动
      if (elementTop > containerBottom || elementTop < containerTop) {
        container.scrollTo({
          top: element.offsetTop - container.clientHeight + element.clientHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages]);

  const getMessageTypeLabel = (type: string) => {
    const labels = {
      'analysis': '数据分析',
      'warning': '警告提醒',
      'action': '执行操作',
      'optimization': '优化建议'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="ai-decision-chat">
      {/* AI聊天窗口头部 */}
      <div className="ai-header">
        <div className="ai-title">
          <div className="ai-icon">🤖</div>
          <h2>生产管理AI助手</h2>
        </div>
        <div className="ai-status">
          <div className="status-indicator active">
            <div className="pulse-dot"></div>
            <span>实时学习中</span>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="messages-container" ref={containerRef}>
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="no-messages">
              <div className="loading-spinner"></div>
              <p>正在初始化AI学习模型...</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`message-item ${message.type}`}>
                {/* 消息头部 */}
                <div className="message-header">
                  <div className="message-type">
                    <span className="type-icon" style={{ color: message.color }}>
                      {message.icon}
                    </span>
                    <span className="type-label">{getMessageTypeLabel(message.type)}</span>
                  </div>
                  <div className="message-time">{message.time}</div>
                </div>

                {/* 消息内容 */}
                <div className="message-content">
                  {message.message.split('\n').map((line, idx) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) return null;

                    const lowerLine = trimmedLine.toLowerCase();
                    if (lowerLine.startsWith('[p0]')) {
                      return <span key={idx} className="priority-line p0">{trimmedLine}</span>;
                    }
                    if (lowerLine.startsWith('[p1]')) {
                      return <span key={idx} className="priority-line p1">{trimmedLine}</span>;
                    }
                    if (lowerLine.startsWith('[p2]')) {
                      return <span key={idx} className="priority-line p2">{trimmedLine}</span>;
                    }
                    return <p key={idx} className="message-text">{line}</p>;
                  })}
                  
                  {message.action && (
                    <div className="action-taken">
                      <div className="action-icon">⚡</div>
                      <div className="action-text">
                        <strong>建议行动：</strong>{message.action}
                      </div>
                    </div>
                  )}
                </div>

                {/* 消息边框效果 */}
                <div className="message-border" style={{ backgroundColor: message.color }}></div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* AI状态信息底部 */}
      <div className="ai-footer">
        <div className="ai-stats">
          <div className="stat-item">
            <span className="stat-label">今日分析：</span>
            <span className="stat-value">{Math.floor(Math.random() * 150) + 50}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">优化建议：</span>
            <span className="stat-value">{Math.floor(Math.random() * 20) + 5}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">准确率：</span>
            <span className="stat-value">{(Math.random() * 10 + 90).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDecisionChat;