import { NextRequest } from 'next/server';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { detectPatterns } from '@/lib/ziwei/patterns';
import { tStar, tPalace, tBranch, tJu, tSiHua, tPattern, tGanzhi } from '@/lib/ziwei/i18n';

interface RequestPayload {
  chart: ZiweiChart;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

function getLocalInterpretation(chart: ZiweiChart, prompt: string): string {
  const mingPalace = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  const majorStars = mingPalace ? mingPalace.stars.filter(s => s.type === 'major') : [];
  const starNames = majorStars.map(s => tStar(s.name) + (s.siHua ? ` Hóa ${tSiHua(s.siHua)}` : '')).join(', ') || 'Vô chính diệu (mượn sao từ cung Thiên Di chiếu về)';
  const patterns = detectPatterns(chart);
  const patternNames = patterns.map(p => tPattern(p.name)).join(', ') || 'Cách cục bình ổn, đắc hòa';
  const currentDx = chart.daXians[chart.currentDaXianIndex];
  const wuxing = tJu(chart.wuxingJuName);

  // Kiểm tra chủ đề
  if (prompt.includes('感情') || prompt.includes('phu thê') || prompt.includes('hôn nhân') || prompt.includes('tình cảm')) {
    const phuThe = chart.palaces.find(p => p.name === '夫妻宫' || p.name === '夫妻');
    const ptStars = phuThe ? phuThe.stars.filter(s => s.type === 'major').map(s => tStar(s.name)).join(', ') : 'Vô chính diệu';
    return `**【Cục Diện Tình Cảm】**
Đương số Cung Mệnh tọa ${tBranch(chart.mingGongBranch)}, nạp âm ${wuxing}. Cung Phu Thê tại ${phuThe ? tBranch(phuThe.branch) : 'đối cung'} có các sao: ${ptStars || 'Vô chính diệu mượn sao đối cung'}. Bản mệnh đối với hôn nhân và tình cảm là người coi trọng sự gắn kết sâu sắc, vừa có tính độc lập vừa mong muốn đối phương hiểu được chí hướng của mình.

**【Phân Tích Cung Phu Thê】**
Theo lý luận của thầy Nghê Hải Hạ trong 《Thiên Kỷ》, Cung Phu Thê không chỉ xem tính cách của người phối ngẫu mà còn là tấm gương phản chiếu sự đối đãi giữa hai bên. Sao chủ tọa thủ mang tính cách quyết đoán nhưng giàu tình cảm. Nếu gặp cát tinh thì phu thê hòa ái, nếu gặp sát tinh cần lấy sự nhường nhịn và lắng nghe làm gốc.

**【Liên Đới Tam Phương Tứ Chính】**
Cung Phúc Đức (chủ đời sống tinh thần) và Cung Thiên Di (giao tiếp bên ngoài) hỗ chiếu mạnh mẽ đến hôn nhân. Người phối ngẫu có thiên hướng giúp đỡ nhiều cho gia đình, đôi bên cùng đồng lòng xây dựng sự nghiệp thì tình cảm càng thêm gắn bó bền chặt.

**【Vận Trình Đại Hạn Hiện Tại】**
Đại hạn ${currentDx ? `${currentDx.startAge}–${currentDx.endAge} tuổi tại ${tPalace(currentDx.palaceName)}` : 'hiện tại'}: Cung vận mở ra những chuyển biến mới trong quan hệ tình cảm. Thời kỳ này thích hợp vun đắp sự thấu hiểu, tránh vì công việc bận rộn bên ngoài mà lơ là đối phương.

**【Lời Khuyên Thực Tiễn】**
Trong đời sống lứa đôi, lấy sự tôn trọng không gian riêng của nhau làm cốt lõi. Gặp việc lớn nên bàn bạc thẳng thắn, không nên giữ tâm sự một mình.`;
  }

  if (prompt.includes('事业') || prompt.includes('sự nghiệp') || prompt.includes('quan lộc')) {
    const quanLoc = chart.palaces.find(p => p.name === '官禄宫' || p.name === '官禄');
    const qlStars = quanLoc ? quanLoc.stars.filter(s => s.type === 'major').map(s => tStar(s.name)).join(', ') : 'Vô chính diệu';
    return `**【Cục Diện Sự Nghiệp】**
Mệnh cách ${wuxing}, Cung Quan Lộc tọa tại ${quanLoc ? tBranch(quanLoc.branch) : ''} hội tụ các sao: ${qlStars || 'Vô chính diệu'}. Đây là mẫu người có tinh thần trách nhiệm cao, năng lực tổ chức và khả năng thích ứng linh hoạt trong công việc.

**【Phân Tích Cung Quan Lộc】**
Thầy Nghê Hải Hạ từng dạy: "Cung Quan Lộc là phong cách hành sự của một người". Bản mệnh làm việc có phương pháp, kiên trì theo đuổi mục tiêu và không dễ bị dao động trước áp lực. Rất phù hợp với các lĩnh vực đòi hỏi chuyên môn vững vàng, khả năng phân tích hoặc quản lý dự án.

**【Phối Chiếu Tài Bạch & Thiên Di】**
Tam phương Tài - Quan - Di tương hỗ đắc lực. Tài lộc đến từ chính năng lực thực chất và công sức bỏ ra, càng xông pha ra bên ngoài hoặc mở rộng mạng lưới giao thiệp thì càng mở ra nhiều cơ hội thăng tiến.

**【Đại Hạn & Thời Vận】**
Đang trong đại vận ${currentDx ? `${currentDx.startAge}–${currentDx.endAge} tuổi (${tPalace(currentDx.palaceName)})` : 'hiện tại'}, đây là giai đoạn tích lũy kinh nghiệm và củng cố vị thế vững chắc, nên tập trung phát huy thế mạnh cá nhân thay vì mạo hiểm mở rộng dàn trải.

**【Lời Khuyên Hành Động】**
Nên chủ động nâng cao năng lực chuyên môn, mở rộng mối quan hệ với cấp trên và đối tác. Khi thời cơ chín muồi, hãy quyết đoán nắm bắt để tạo bước đột phá.`;
  }

  if (prompt.includes('财运') || prompt.includes('tài vận') || prompt.includes('tiền bạc')) {
    const taiBach = chart.palaces.find(p => p.name === '财帛宫' || p.name === '财帛');
    const tbStars = taiBach ? taiBach.stars.filter(s => s.type === 'major').map(s => tStar(s.name)).join(', ') : 'Vô chính diệu';
    return `**【Cục Diện Tài Lộc】**
Cung Tài Bạch tọa tại ${taiBach ? tBranch(taiBach.branch) : ''} có các sao: ${tbStars || 'Vô chính diệu'}. Dòng tiền của đương số vận hành ổn định, có nguồn thu rõ ràng và thiên về thực lực tích lũy lâu dài hơn là đầu cơ may rủi.

**【Cung Điền Trạch (Kho Chứa Tài Lộc)】**
Theo trường phái 《Thiên Kỷ》 của thầy Nghê: "Tài Bạch là dòng tiền ra vào, còn Điền Trạch mới chính là kho giữ của". Đương số có khả năng tích lũy tài sản và bất động sản tốt, tiền kiếm được nên chuyển hóa thành tài sản cố định hoặc đầu tư giá trị để tránh hao tán vô cớ.

**【Vận Trình Tài Khí Đại Hạn】**
Đại hạn ${currentDx ? `${currentDx.startAge}–${currentDx.endAge} tuổi` : 'hiện tại'} tài vận ở mức khá tốt, thuận lợi cho việc gia tăng nguồn thu từ chuyên môn và quản lý dòng tiền bài bản.

**【Lời Khuyên Quản Lý Tài Chính】**
Nên phân bổ tài chính theo tỷ lệ an toàn, hạn chế vay mượn vượt quá năng lực chi trả và duy trì quỹ dự phòng cho những kế hoạch dài hạn.`;
  }

  // Mặc định: Luận giải tổng quan bản mệnh
  return `**【Định Tính Mệnh Cách】**
Bản mệnh sinh năm ${tGanzhi(chart.lunarInfo.yearStem, chart.lunarInfo.yearBranch)}, nạp âm ${wuxing}. Cung Mệnh an tại ${tBranch(chart.mingGongBranch)}, Cung Thân an tại ${tBranch(chart.shenGongBranch)}. Các chính tinh thủ Mệnh: ${starNames}. Khí chất cương nghị, tư duy sâu sắc, có bản lĩnh tự lập và ý chí vươn lên mạnh mẽ.

**【Luận Giải Chính Tinh】**
Theo hệ thống giảng dạy 《Thiên Kỷ》 của thầy Nghê Hải Hạ: Cung Mệnh là bản thể gốc rễ, quyết định thiên bẩm và nhân cách cốt lõi. Sự phối chiếu của ${starNames} mang đến khả năng bao quát toàn cục, tinh thần dám nghĩ dám làm và giàu lòng tự trọng. Gặp hoàn cảnh nghịch cảnh không nản chí, càng rèn giũa càng phát tiết tinh hoa.

**【Tam Phương Tứ Chính & Cách Cục】**
Cách cục nhận diện: ${patternNames}.
Tam phương Tài Bạch, Quan Lộc và đối cung Thiên Di giao hội tạo thành thế kiềng ba chân vững chãi. Đương số ra ngoài giao tiếp tạo được uy tín, trong công việc được cấp trên tin cậy và đồng nghiệp vị nể.

**【Vận Trình Đại Hạn Hiện Tại】**
Đương số đang bước vào Đại Hạn ${currentDx ? `${currentDx.startAge}–${currentDx.endAge} tuổi, tọa thủ tại Cung ${tPalace(currentDx.palaceName)}` : 'trọng yếu'}. Đây là thập niên chuyển mình quan trọng, đòi hỏi sự kiên định trong định hướng và tập trung tối đa nguồn lực vào những mục tiêu then chốt.

**【Ưu Thế & Lời Khuyên Tu Thân】**
Thế mạnh lớn nhất là sự sáng suốt, kiên trì và tầm nhìn chiến lược. Lời khuyên vàng của thầy Nghê: "Nhất Mệnh, Nhị Vận, Tam Phong Thủy, Tứ Tích Đức, Ngũ Độc Thư" — hãy luôn giữ tâm bình thản, bồi đắp tri thức và không ngừng hoàn thiện bản thân thì tương lai ắt hanh thông thuận lợi.`;
}

export async function POST(req: NextRequest) {
  try {
    const payload: RequestPayload = await req.json();
    const { chart, messages } = payload;
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';

    // Kiểm tra cấu hình API Key bên ngoài (DeepSeek, OpenAI, MIMO...)
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.MIMO_API_KEY;
    const isCustomKey = apiKey && apiKey !== 'your-deepseek-api-key' && !apiKey.includes('your-');

    if (isCustomKey) {
      const baseUrl = process.env.MIMO_BASE_URL || (process.env.DEEPSEEK_API_KEY ? 'https://api.deepseek.com' : 'https://api.openai.com/v1');
      const model = process.env.MIMO_MODEL || (process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4o-mini');

      const systemPrompt = `Bạn là chuyên gia Tử Vi Đẩu Số theo hệ phái chính tông của thầy Nghê Hải Hạ (Thiên Kỷ). 
Hãy phân tích lá số chi tiết, khách quan, thấu đáo bằng tiếng Việt dựa trên dữ liệu lá số được cung cấp:
- Mệnh Cung: ${tBranch(chart.mingGongBranch)}, Thân Cung: ${tBranch(chart.shenGongBranch)}
- Cục số: ${tJu(chart.wuxingJuName)}
- Hãy giữ giọng văn trang trọng, chuẩn mực, mang tính định hướng tích cực.`;

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

    // Khi chưa cấu hình AI key ngoài: Dùng engine luận giải tích hợp bản địa theo thuật toán lá số
    const content = getLocalInterpretation(chart, lastUserMsg);

    // Stream nội dung theo chuẩn SSE (data: {"delta":{"text":"..."}})
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Cắt theo từng đoạn văn để tạo hiệu ứng gõ chữ mượt mà
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
