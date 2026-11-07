import { NextRequest } from 'next/server';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { tBranch, tJu } from '@/lib/ziwei/i18n';
import { generateHemingAnalysis } from '@/lib/ziwei/heming-engine';

interface HemingPayload {
  chartA: ZiweiChart;
  chartB: ZiweiChart;
  question?: string;
  lang?: 'vi' | 'zh';
}

export async function POST(req: NextRequest) {
  try {
    const payload: HemingPayload = await req.json();
    const { chartA, chartB, question } = payload;
    const lang = payload.lang ?? 'zh';

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.MIMO_API_KEY;
    const isCustomKey = apiKey && apiKey !== 'your-deepseek-api-key' && !apiKey.includes('your-');

    if (isCustomKey) {
      const baseUrl = process.env.MIMO_BASE_URL || (process.env.DEEPSEEK_API_KEY ? 'https://api.deepseek.com' : 'https://api.openai.com/v1');
      const model = process.env.MIMO_MODEL || (process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4o-mini');

      const systemPrompt = lang === 'vi'
        ? `Bạn là chuyên gia luận giải Tử Vi Hợp Bàn theo hệ phái chính tông của thầy Nghê Hải Hạ.
Phân tích sự tương hợp giữa 2 người (tình duyên, làm ăn, gia đạo) bằng tiếng Việt chi tiết, sâu sắc, thực chứng theo phương pháp hợp bàn của 《Thiên Kỷ》.`
        : `你是倪海厦《天纪》与《紫微斗数全书》正统合盘命理专家。
请根据双方命盘的主星、五行局、夫妻宫、福德宫与生年四化飞星，深度剖析双方八字天干地支、气象契合度、婚姻缘分及互补建议，采用典雅深厚的文言/现代中文双重风格输出。`;

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
            {
              role: 'user',
              content: `合盘分析：
方A: ${JSON.stringify(chartA.birthInfo)}, 命宫: ${tBranch(chartA.mingGongBranch)}, 五行局: ${tJu(chartA.wuxingJuName)}
方B: ${JSON.stringify(chartB.birthInfo)}, 命宫: ${tBranch(chartB.mingGongBranch)}, 五行局: ${tJu(chartB.wuxingJuName)}
${question ? `重点咨询: ${question}` : ''}`,
            },
          ],
        }),
      });

      if (aiRes.ok && aiRes.body) {
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

    // ─── Động cơ hợp bàn nội bộ chính tông Nghê Hải Hạ 8 tầng ───
    const analysisResult = generateHemingAnalysis(chartA, chartB, question, lang);
    const content = analysisResult.content;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Stream theo từng đoạn ngắn (80 ký tự hoặc từ) để tạo trải nghiệm sinh động mượt mà
        const chunks = content.match(/[\s\S]{1,80}/g) || [content];
        for (const chunk of chunks) {
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
