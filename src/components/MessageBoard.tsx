import { useState } from 'react'
import { useDbMessages } from '@/hooks/use-db-messages'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Message, MessageType } from '@/lib/types'
import { ChatCircleText, Lightbulb, User, CalendarBlank, PaperPlaneTilt, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const FEEDBACK_TEMPLATE = `【问题现象】：
【复现步骤】：
1. 
2. 
【反馈人】：`

const FEATURE_TEMPLATE = `【需求描述】：
【使用场景】：
【反馈人】：`

export function MessageBoard() {
  const { messages, addMessage, deleteMessage, isLoading } = useDbMessages()
  const [activeType, setActiveType] = useState<MessageType>('feedback')
  const [content, setContent] = useState(FEEDBACK_TEMPLATE)
  const [author, setAuthor] = useState('')

  const handleTypeChange = (type: string) => {
    const newType = type as MessageType
    setActiveType(newType)
    if (newType === 'feedback') {
      setContent(FEEDBACK_TEMPLATE)
    } else {
      setContent(FEATURE_TEMPLATE)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('请输入内容')
      return
    }

    const newMessage: Message = {
      id: crypto.randomUUID(),
      type: activeType,
      content,
      author: author || '匿名用户',
      createdAt: new Date().toISOString(),
    }

    const success = await addMessage(newMessage)
    if (success) {
      toast.success('提交成功，感谢您的反馈！')
      
      // Reset form but keep template
      setAuthor('')
      setContent(activeType === 'feedback' ? FEEDBACK_TEMPLATE : FEATURE_TEMPLATE)
    }
  }

  const messageList = messages || []

  return (
    <Card className="h-full flex flex-col border-muted/40 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ChatCircleText size={24} className="text-primary" />
          留言板
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <Tabs value={activeType} onValueChange={handleTypeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <ChatCircleText size={16} />
              问题反馈
            </TabsTrigger>
            <TabsTrigger value="feature_request" className="flex items-center gap-2">
              <Lightbulb size={16} />
              需求收集
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3">
          <Input
            placeholder="您的称呼 (可选)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="bg-background/50"
          />
          <Textarea
            placeholder="请输入内容..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px] font-mono text-sm bg-background/50 resize-none"
          />
          <Button onClick={handleSubmit} className="w-full gap-2">
            <PaperPlaneTilt size={18} />
            提交留言
          </Button>
        </div>

        <div className="flex-1 flex flex-col min-h-0 mt-2">
          <h3 className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2">
            最近留言 ({messageList.length})
          </h3>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  正在加载留言...
                </div>
              ) : messageList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  暂无留言
                </div>
              ) : (
                messageList.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "p-3 rounded-lg border text-sm space-y-2",
                      msg.type === 'feedback' 
                        ? "bg-destructive/5 border-destructive/10" 
                        : "bg-primary/5 border-primary/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={msg.type === 'feedback' ? 'destructive' : 'default'}
                        className="text-[10px] px-1.5 py-0 h-4"
                      >
                        {msg.type === 'feedback' ? '反馈' : '需求'}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <CalendarBlank size={12} />
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="删除留言"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed">
                      {msg.content}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-1 border-t border-muted/20">
                      <User size={12} />
                      {msg.author}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
