'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

interface InsightPanelProps {
  chart: ZiweiChart;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
}

const TOPICS = [
  { key: 'overview',    label: 'Mệnh cách' },
  { key: 'personality', label: 'Tính cách' },
  { key: 'love',        label: 'Tình duyên' },
  { key: 'career',      label: 'Sự nghiệp' },
  { key: 'wealth',      label: 'Tài vận' },
  { key: 'health',      label: 'Sức khỏe' },
  { key: 'home',        label: 'Điền trạch' },
  { key: 'children',    label: 'Tử tức' },
  { key: 'move',        label: 'Thiên di' },
  { key: 'friends',     label: 'Nô bộc' },
  { key: 'family',      label: 'Huynh đệ' },
  { key: 'spirit',      label: 'Phúc đức' },
  { key: 'parents',     label: 'Phụ mẫu' },
] as const;

/** Render Markdown content cleanly with gold headers and styled bold text */
function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const sectionMatch = line.match(/^\*\*【(.+?)】\*\*$/);
        if (sectionMatch) {
          return (
            <div key={`sec-${i}`} className="pt-3 pb-0.5 first:pt-0">
              <span className="text-[12px] font-semibold tracking-wide" style={{ color: 'var(--t-gold)' }}>
                【{sectionMatch[1]}】
              </span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={`empty-${i}`} className="h-1" />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <div key={`line-${i}`} className="text-[11.5px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>
            {parts.map((part, j) =>
              j % 2 === 0 ? (
                <span key={j}>{part}</span>
              ) : (
                <strong key={j} className="font-medium" style={{ color: 'var(--t-text)' }}>
                  {part}
                </strong>
              )
            )}
          </div>
        );
      })}
      {streaming && (
        <span
          className="inline-block w-1.5 h-3 ml-0.5 animate-pulse rounded-sm align-middle"
          style={{ background: 'var(--t-gold)', opacity: 0.6 }}
        />
      )}
    </div>
  );
}

export default function InsightPanel({ chart, selectedPalace }: InsightPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [lang, setLang] = useState<'vi' | 'zh'>('vi');
  const [tabContents, setTabContents] = useState<Record<string, { vi?: string; zh?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [customQa, setCustomQa] = useState<Record<string, { q: string; a: string }[]>>({});
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);

  const loadingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPalaceBranch = useRef<number | undefined>(undefined);

  // Reset tab cache khi lá số thay đổi
  const chartKey = chart ? `${chart.birthInfo?.year}-${chart.birthInfo?.month}-${chart.birthInfo?.day}-${chart.birthInfo?.hour}-${chart.birthInfo?.gender}` : '';
  const lastChartKey = useRef(chartKey);

  useEffect(() => {
    if (chartKey !== lastChartKey.current) {
      lastChartKey.current = chartKey;
      setTabContents({});
      setCustomQa({});
      loadingRef.current = false;
    }
  }, [chartKey]);

  // Load content for a tab
  const fetchTopicContent = useCallback(async (topicKey: string, targetLang: 'vi' | 'zh') => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, topic: topicKey, lang: targetLang }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Failed to fetch');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamed = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            streamed += delta;
            setTabContents(prev => ({
              ...prev,
              [topicKey]: {
                ...prev[topicKey],
                [targetLang]: streamed,
              },
            }));
          } catch { /* skip */ }
        }
      }
    } catch {
      setTabContents(prev => ({
        ...prev,
        [topicKey]: {
          ...prev[topicKey],
          [targetLang]: 'Không thể tải nội dung luận giải. Vui lòng thử lại sau.',
        },
      }));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [chart]);

  // Load initial overview tab
  useEffect(() => {
    if (!tabContents['overview']?.[lang]) {
      fetchTopicContent('overview', lang);
    }
  }, [fetchTopicContent, lang, tabContents]);

  // Handle Tab Switch
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (!tabContents[key]?.[lang]) {
      fetchTopicContent(key, lang);
    }
  };

  // Toggle Language
  const toggleLanguage = () => {
    const nextLang = lang === 'vi' ? 'zh' : 'vi';
    setLang(nextLang);
    if (!tabContents[activeTab]?.[nextLang]) {
      fetchTopicContent(activeTab, nextLang);
    }
  };

  // When palace is selected on chart
  useEffect(() => {
    if (!selectedPalace || selectedPalace.branch === lastPalaceBranch.current) return;
    lastPalaceBranch.current = selectedPalace.branch;
    // Map palace name to topic if matches
    const name = selectedPalace.name;
    const match = TOPICS.find(t => name.includes(t.label) || (t.key === 'overview' && name.includes('Mệnh')));
    if (match) {
      handleTabChange(match.key);
    }
  }, [selectedPalace]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ask custom question
  const handleAsk = async () => {
    if (!input.trim() || asking) return;
    const question = input.trim();
    setInput('');
    setAsking(true);

    const currentTab = activeTab;
    setCustomQa(prev => ({
      ...prev,
      [currentTab]: [...(prev[currentTab] || []), { q: question, a: 'Đang suy ngẫm câu trả lời…' }],
    }));

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chart,
          messages: [{ role: 'user', content: question }],
          topic: currentTab,
          lang,
        }),
      });

      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            answer += delta;
            setCustomQa(prev => {
              const list = [...(prev[currentTab] || [])];
              if (list.length > 0) {
                list[list.length - 1] = { q: question, a: answer };
              }
              return { ...prev, [currentTab]: list };
            });
          } catch { /* skip */ }
        }
      }
    } catch {
      setCustomQa(prev => {
        const list = [...(prev[currentTab] || [])];
        if (list.length > 0) {
          list[list.length - 1] = { q: question, a: 'Chưa thể kết nối trả lời. Vui lòng thử lại.' };
        }
        return { ...prev, [currentTab]: list };
      });
    } finally {
      setAsking(false);
    }
  };

  const currentTopic = TOPICS.find(t => t.key === activeTab);
  const currentContent = tabContents[activeTab]?.[lang];
  const qas = customQa[activeTab] || [];

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden card-glass border lg:sticky lg:top-4 h-[780px] max-h-[calc(100vh-80px)]"
      style={{ borderColor: 'var(--t-border)' }}
    >

      {/* ── Tab Bar ── */}
      <div className="flex-shrink-0 px-2.5 pt-2.5 pb-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold tracking-wider flex items-center gap-1.5" style={{ color: 'var(--t-gold)' }}>
            ✦ LUẬN GIẢI 13 CHỦ ĐỀ
          </span>
          <div className="flex items-center rounded-lg p-0.5" style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}>
            <button
              onClick={() => {
                if (lang !== 'vi') {
                  setLang('vi');
                  if (!tabContents[activeTab]?.['vi']) fetchTopicContent(activeTab, 'vi');
                }
              }}
              className="text-[10px] px-2 py-0.5 rounded-md transition-all font-medium"
              style={{
                background: lang === 'vi' ? 'rgba(212,168,67,0.22)' : 'transparent',
                color: lang === 'vi' ? 'var(--t-gold)' : 'var(--t-faint)',
              }}
              title="Xem bản dịch Tiếng Việt"
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              onClick={() => {
                if (lang !== 'zh') {
                  setLang('zh');
                  if (!tabContents[activeTab]?.['zh']) fetchTopicContent(activeTab, 'zh');
                }
              }}
              className="text-[10px] px-2 py-0.5 rounded-md transition-all font-medium"
              style={{
                background: lang === 'zh' ? 'rgba(212,168,67,0.22)' : 'transparent',
                color: lang === 'zh' ? 'var(--t-gold)' : 'var(--t-faint)',
              }}
              title="Xem nguyên văn chữ Hán từ Dataset 《Thiên Kỷ》"
            >
              📜 Nguyên bản Hán
            </button>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-1">
          {TOPICS.map(t => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all duration-150"
                style={{
                  background: isActive ? 'rgba(212,168,67,0.15)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(212,168,67,0.4)' : 'var(--t-border)'}`,
                  color: isActive ? 'var(--t-gold)' : 'var(--t-faint)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content Area (Scrollable) ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(212,168,67,0.4) transparent',
        }}
      >
        <div className="flex items-center justify-between pb-2 mb-2" style={{ borderBottom: '1px dashed var(--t-border)' }}>
          <div className="text-[12px] font-semibold" style={{ color: 'var(--t-gold)' }}>
            Chủ đề: {currentTopic?.label}
          </div>
          <span className="text-[10px]" style={{ color: 'var(--t-faint)' }}>
            {lang === 'vi' ? 'Luận giải thuật số thuần Việt' : 'Nguyên bản trích dẫn Nghê Hải Hạ'}
          </span>
        </div>

        {/* Loading placeholder when content empty */}
        {loading && !currentContent && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-3xl mb-3 animate-spin" style={{ color: 'var(--t-gold)', opacity: 0.4 }}>✦</div>
            <p className="text-[11px] animate-pulse" style={{ color: 'var(--t-faint)' }}>
              Đang kết xuất luận giải {currentTopic?.label}…
            </p>
          </div>
        )}

        {/* Main Tab Text */}
        {currentContent && (
          <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <AiContent text={currentContent} streaming={loading} />
          </div>
        )}

        {/* Custom Q&A for this tab */}
        {qas.length > 0 && (
          <div className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--t-border)' }}>
            <div className="text-[10px] tracking-wider uppercase font-semibold" style={{ color: 'var(--t-faint)' }}>
              Hỏi đáp thêm về {currentTopic?.label}:
            </div>
            {qas.map((item, idx) => (
              <div key={idx} className="space-y-1.5 text-[11px]">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg px-3 py-1.5" style={{ background: 'rgba(212,168,67,0.1)', color: 'var(--t-gold)' }}>
                    {item.q}
                  </div>
                </div>
                <div className="rounded-lg p-2.5 leading-relaxed" style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', color: 'var(--t-text2)' }}>
                  <AiContent text={item.a} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Input bar for asking custom questions ── */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAsk()}
            placeholder={`Hỏi thêm về ${currentTopic?.label || 'mệnh cách'}…`}
            disabled={asking}
            className="flex-1 rounded-lg px-3 py-2 text-[11px] focus:outline-none transition-colors"
            style={{
              background: 'var(--t-card)',
              border: '1px solid var(--t-border)',
              color: 'var(--t-text)',
            }}
          />
          <button
            onClick={handleAsk}
            disabled={asking || !input.trim()}
            className="px-3.5 py-2 rounded-lg text-[11px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(212,168,67,0.18)',
              border: '1px solid rgba(212,168,67,0.3)',
              color: 'var(--t-gold)',
            }}
          >
            {asking ? '…' : 'Hỏi'}
          </button>
        </div>
      </div>

    </div>
  );
}
