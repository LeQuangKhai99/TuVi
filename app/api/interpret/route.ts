import { NextRequest } from 'next/server';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { tBranch, tJu } from '@/lib/ziwei/i18n';
import { lookupDatasetChart, detectTopicKey } from '@/lib/ziwei/dataset';
import { generateVietnameseInterpretation } from '@/lib/ziwei/interpret-vi';

interface RequestPayload {
  chart: ZiweiChart;
  messages: { role: 'user' | 'assistant'; content: string }[];
  topic?: string;
  lang?: 'vi' | 'zh';
}

export async function POST(req: NextRequest) {
  try {
    const payload: RequestPayload = await req.json();
    const { chart, messages, topic, lang = 'vi' } = payload;
    const lastUserMsg = messages?.filter(m => m.role === 'user').pop()?.content || '';

    // Xác định chủ đề từ client hoặc từ câu hỏi người dùng
    const topicKey = topic ? detectTopicKey(topic) : detectTopicKey(lastUserMsg);

    // Tra cứu dữ liệu từ Dataset v4.0 (Nghê Hải Hạ 674,976 lá số)
    let datasetReading: string | undefined;
    let datasetError: string | undefined;
    if (chart?.birthInfo) {
      try {
        const shouldTranslate = (lang === 'vi');
        const datasetRes = await lookupDatasetChart(chart.birthInfo, topicKey, shouldTranslate);
        if (datasetRes.success && datasetRes.content) {
          datasetReading = datasetRes.content;
        } else {
          datasetError = datasetRes.error;
          console.warn('Dataset lookup returned unsuccessful:', datasetRes.error);
        }
      } catch (e) {
        datasetError = (e as Error).message;
        console.warn('Dataset lookup fallback:', (e as Error).message);
      }
    }

    // Kiểm tra cấu hình API Key bên ngoài (DeepSeek, OpenAI, MIMO...)
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.MIMO_API_KEY;
    const isCustomKey = apiKey && apiKey !== 'your-deepseek-api-key' && !apiKey.includes('your-');

    if (isCustomKey) {
      const baseUrl = process.env.MIMO_BASE_URL || (process.env.DEEPSEEK_API_KEY ? 'https://api.deepseek.com' : 'https://api.openai.com/v1');
      const model = process.env.MIMO_MODEL || (process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4o-mini');

      let systemPrompt = `Bạn là chuyên gia Tử Vi Đẩu Số theo hệ phái chính tông của thầy Nghê Hải Hạ (Thiên Kỷ). 
Hãy phân tích lá số chi tiết, khách quan, thấu đáo bằng tiếng Việt dựa trên dữ liệu lá số được cung cấp:
- Mệnh Cung: ${tBranch(chart.mingGongBranch)}, Thân Cung: ${tBranch(chart.shenGongBranch)}
- Cục số: ${tJu(chart.wuxingJuName)}
- Hãy giữ giọng văn trang trọng, chuẩn mực, mang tính định hướng tích cực.`;

      if (datasetReading) {
        systemPrompt += `\n\n[DỮ LIỆU GỐC TỪ KHO BỘ LÁ SỐ NGHÊ HẢI HẠ 《THIÊN KỶ》]:\n${datasetReading}\n\nHãy dịch, đối chiếu và diễn giải tài liệu gốc trên sang tiếng Việt một cách sâu sắc, giữ nguyên các trích dẫn, cách cục và lời khuyên then chốt của thầy Nghê.`;
      }

      const aiRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (aiRes.ok && aiRes.body) {
        // Stream lại từ AI provider
        const transformStream = new TransformStream({
          transform(chunk, controller) {
            const text = new TextDecoder().decode(chunk);
            const lines = text.split('\n');
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                break;
              }
              try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta?.content || '';
                if (delta) {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ delta: { text: delta } })}\n\n`));
                }
              } catch { /* skip */ }
            }
          },
        });

        return new Response(aiRes.body.pipeThrough(transformStream), {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
    }

    // Khi chưa cấu hình AI key ngoài: Ưu tiên trả về toàn văn bản dịch nguyên tác đầy đủ của dataset
    let content: string;
    if (datasetReading) {
      if (lang === 'zh') {
        content = datasetReading.startsWith('>') 
          ? datasetReading 
          : `> 📖 **倪海厦《天纪》与《紫微斗数全书》命盘实证全量数据库（Dataset v4.0 原文）**\n\n${datasetReading}`;
      } else {
        content = datasetReading;
      }
    } else {
      if (lang === 'zh') {
        if (datasetError === 'FILE_NOT_DOWNLOADED') {
          content = `> ⚠️ **未在本地检测到 ${chart?.birthInfo?.year || ''} 年份的《天纪》全量数据集文件**\n\n当前尚未下载该出生年份的 \`year-${chart?.birthInfo?.year || ''}.jsonl.zst\` 数据文件。\n请在项目根目录下双击运行 \`tai-dataset.bat\`，输入数字 **2** 并输入该年份即可极速下载（约 2MB），下载完成后即可在此处查看 100% 原始完整版倪海厦《天纪》与《紫微斗数全书》原版解读。`;
        } else {
          content = `> ⚠️ **未能读取 ${chart?.birthInfo?.year || ''} 年份命盘数据集**\n\n提示: ${datasetError || 'Không tìm thấy dữ liệu'}\n请确认时辰及输入信息是否准确。`;
        }
      } else {
        const fallback = generateVietnameseInterpretation(chart, topicKey);
        if (datasetError === 'FILE_NOT_DOWNLOADED') {
          content = `> ℹ️ *Gợi ý: Năm sinh ${chart?.birthInfo?.year || ''} chưa tải file dữ liệu nguyên bản \`year-${chart?.birthInfo?.year || ''}.jsonl.zst\` (bạn có thể chạy file \`tai-dataset.bat\` ở thư mục gốc để tải ~2MB). Dưới đây là phân tích bản mệnh offline tự động:* \n\n${fallback}`;
        } else {
          content = fallback;
        }
      }
    }

    // Stream nội dung theo chuẩn SSE (data: {"delta":{"text":"..."}})
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Stream theo từng khối văn bản (khoảng 80 ký tự) để gõ chữ nhanh và mượt mà
        const CHUNK_SIZE = 80;
        for (let i = 0; i < content.length; i += CHUNK_SIZE) {
          const chunk = content.slice(i, i + CHUNK_SIZE);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text: chunk } })}\n\n`));
          await new Promise(r => setTimeout(r, 15));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
