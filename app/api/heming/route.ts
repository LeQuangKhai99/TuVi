import { NextRequest } from 'next/server';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { tBranch, tJu, tStar, tGanzhi } from '@/lib/ziwei/i18n';

interface HemingPayload {
  chartA: ZiweiChart;
  chartB: ZiweiChart;
  question?: string;
}

function getLocalHeming(cA: ZiweiChart, cB: ZiweiChart, question?: string): string {
  const nameA = cA.birthInfo.name || 'Người A';
  const nameB = cB.birthInfo.name || 'Người B';
  const branchA = tBranch(cA.mingGongBranch);
  const branchB = tBranch(cB.mingGongBranch);
  const juA = tJu(cA.wuxingJuName);
  const juB = tJu(cB.wuxingJuName);

  const mingPalaceA = cA.palaces.find(p => p.branch === cA.mingGongBranch);
  const mingPalaceB = cB.palaces.find(p => p.branch === cB.mingGongBranch);
  const starsA = mingPalaceA?.stars.filter(s => s.type === 'major').map(s => tStar(s.name)).join(', ') || 'Vô chính diệu';
  const starsB = mingPalaceB?.stars.filter(s => s.type === 'major').map(s => tStar(s.name)).join(', ') || 'Vô chính diệu';

  return `**【Độ Tương Hợp Duyên Phận】**
Đối chiếu hai lá số:
- **${nameA}**: Sinh năm ${tGanzhi(cA.lunarInfo.yearStem, cA.lunarInfo.yearBranch)}, Cung Mệnh an tại ${branchA} (${juA}), sao chủ tọa thủ: ${starsA}.
- **${nameB}**: Sinh năm ${tGanzhi(cB.lunarInfo.yearStem, cB.lunarInfo.yearBranch)}, Cung Mệnh an tại ${branchB} (${juB}), sao chủ tọa thủ: ${starsB}.

Theo phương pháp hợp bàn của thầy Nghê Hải Hạ trong 《Thiên Kỷ》, quan hệ giữa hai người có sự bù trừ khí chất rất rõ nét: một người thiên về bao quát, quyết đoán trong hành sự; người kia tinh tế, chu đáo và biết lắng nghe. Đây là mẫu kết hợp âm dương tương đắc, càng gắn bó lâu dài càng nhận thấy giá trị của nhau.

**【Cung Phu Thê Đối Chiếu】**
Hình mẫu người phối ngẫu trên Cung Phu Thê của ${nameA} phản ánh rất sát những nét tính cách nổi trội của ${nameB}. Sự giao thoa của các cát tinh cho thấy hai bên có duyên phận sâu đậm, dễ thấu hiểu tâm lý và có tiếng nói chung trong các quyết định lớn của cuộc sống.

**【Điểm Hòa Hợp & Bổ Trợ】**
- **Tư duy & Mục tiêu**: Cả hai đều coi trọng sự ổn định, có ý chí vun vén gia đình và sự nghiệp.
- **Tài lộc**: Dòng khí của ${juA} và ${juB} tương sinh bổ trợ, khi cùng nhau hợp tác hoặc quản lý tài chính sẽ dễ tích lũy của cải hơn là hành động đơn độc.

**【Điểm Cần Lưu Tâm Dung Hòa】**
Đôi khi cả hai đều có cá tính riêng khá mạnh, khi xảy ra bất đồng quan điểm không nên vội vã tranh luận đến cùng. Hãy cho nhau một khoảng lặng ngắn để suy ngẫm, sự mềm mỏng sẽ hóa giải mọi gút mắc.

**【Lời Khuyên Ứng Xử】**
Duyên do trời định, nhưng phận tại nhân tâm. Hãy luôn trân trọng người trước mắt, đặt sự tin tưởng và bao dung làm nền tảng thì mối quan hệ sẽ đơm hoa kết trái bền vững theo năm tháng.`;
}

export async function POST(req: NextRequest) {
  try {
    const payload: HemingPayload = await req.json();
    const { chartA, chartB, question } = payload;

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.MIMO_API_KEY;
    const isCustomKey = apiKey && apiKey !== 'your-deepseek-api-key' && !apiKey.includes('your-');

    if (isCustomKey) {
      const baseUrl = process.env.MIMO_BASE_URL || (process.env.DEEPSEEK_API_KEY ? 'https://api.deepseek.com' : 'https://api.openai.com/v1');
      const model = process.env.MIMO_MODEL || (process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4o-mini');

      const systemPrompt = `Bạn là chuyên gia luận giải Tử Vi Hợp Bàn theo hệ phái chính tông của thầy Nghê Hải Hạ.
Phân tích sự tương hợp giữa 2 người (tình duyên, làm ăn, gia đạo) bằng tiếng Việt chi tiết, sâu sắc và trang nhã.`;

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
              content: `Phân tích hợp bàn:
Người A: ${JSON.stringify(chartA.birthInfo)}, Mệnh: ${tBranch(chartA.mingGongBranch)}, Cục: ${tJu(chartA.wuxingJuName)}
Người B: ${JSON.stringify(chartB.birthInfo)}, Mệnh: ${tBranch(chartB.mingGongBranch)}, Cục: ${tJu(chartB.wuxingJuName)}
${question ? `Câu hỏi trọng tâm: ${question}` : ''}`,
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

    const content = getLocalHeming(chartA, chartB, question);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = content.split(/(\s+|\n+)/);
        for (const w of words) {
          if (!w) continue;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text: w } })}\n\n`));
          await new Promise(r => setTimeout(r, 12));
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
