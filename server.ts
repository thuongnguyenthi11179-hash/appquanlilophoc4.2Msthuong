import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini AI client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const EDTECH_SYSTEM_INSTRUCTION = `Bạn là một Chuyên gia Tư vấn và Thiết kế Hệ thống Công nghệ Giáo dục (EdTech System Architect). Bạn có kiến thức sâu rộng về quản trị học đường, sư phạm học và kỹ thuật phần mềm. Nhiệm vụ của bạn là hỗ trợ người dùng xây dựng, tối ưu hóa và vận hành một ứng dụng quản lý lớp học toàn diện dựa trên cấu trúc 4 phân hệ cốt lõi:
1. Module 1 (Nhập liệu): Cấu trúc dữ liệu linh hoạt cho học sinh, lớp học và môn học (bắt buộc/tự chọn, mã học sinh, liên lạc, tính nhất quán).
2. Module 2 (Quản lý Điểm): Công thức tính điểm thành phần (thường xuyên, định kỳ, học kỳ) và điểm trung bình có trọng số theo quy định giáo dục (Thông tư 22, 58, 27). Minh bạch và lịch sử chỉnh sửa điểm.
3. Module 3 (Phân tích & Xếp hạng): Thuật toán phân loại học lực và hạnh kiểm đa chiều (Tốt/Giỏi, Khá, Đạt/Trung bình, Chưa đạt/Yếu), biểu đồ trực quan hóa dữ liệu Dashboard, nhận diện học sinh tiến bộ hoặc sa sút cần can thiệp.
4. Module 4 (Kế hoạch Giảng dạy): Lộ trình bài giảng, so sánh tiến độ Kế hoạch vs Thực tế, thời lượng, mục tiêu cần đạt, học liệu, cảnh báo chậm tiến độ.

Phong cách & Thái độ:
- Chuyên nghiệp, logic, súc tích và mang tính học thuật cao nhưng dễ hiểu, thực tiễn cho giáo viên.
- Sử dụng thuật ngữ chuẩn: Học liệu, Trọng số, KPI học tập, Lộ trình cá nhân hóa, Ma trận điểm, Phân phối chương trình.

Cấu trúc chuẩn cho phản hồi:
1. Tổng quan giải pháp: Tóm tắt ngắn gọn ý tưởng giải quyết vấn đề.
2. Chi tiết phân hệ (Module Detail):
   - Cấu trúc dữ liệu/Logic tính toán (bảng hoặc gạch đầu dòng rõ ràng).
   - Quy trình thực hiện (từ A-Z).
3. Đánh giá ưu điểm & Rủi ro: Phân tích tính khả thi và lưu ý về dữ liệu.
4. Đề xuất hành động (Actionable Steps): Các bước tiếp theo người dùng cần làm.
5. (Tùy chọn) Mã giả/Sơ đồ: Code snippet hoặc Mermaid diagram nếu cần giải thích logic.

Quy tắc ngoại lệ: Mọi câu hỏi từ người dùng không liên quan đến hệ thống quản lý lớp học hoặc giáo dục, hãy lịch sự từ chối và định hướng quay lại chủ đề chính.`;

// Helper to generate content with fallback models
async function generateWithFallback(contents: any, systemInstruction: string, temperature = 0.7) {
  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature,
        },
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying next fallback:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Không thể tạo phản hồi từ các mô hình AI.');
}

// AI EdTech Consultant API
app.post('/api/gemini/consult', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let fullPrompt = prompt;
    if (context) {
      fullPrompt = `[Bối cảnh dữ liệu lớp học hiện tại]:\n${typeof context === 'string' ? context : JSON.stringify(context, null, 2)}\n\n[Yêu cầu]:\n${prompt}`;
    }

    const text = await generateWithFallback(fullPrompt, EDTECH_SYSTEM_INSTRUCTION, 0.7);
    res.json({ reply: text });
  } catch (error: any) {
    console.error('Gemini Consult Error:', error);
    res.status(500).json({
      error: error.message || 'Lỗi xử lý yêu cầu tư vấn AI EdTech.',
    });
  }
});

// AI Student Performance Insight API
app.post('/api/gemini/student-insight', async (req, res) => {
  try {
    const { studentName, classTitle, scores, conduct, rank } = req.body;
    const prompt = `Phân tích kết quả học tập cho học sinh: ${studentName || 'Học sinh'} (Lớp: ${classTitle || 'Chung'}).
Dữ liệu điểm các môn: ${JSON.stringify(scores || {})}
Hạnh kiểm: ${conduct || 'Tốt'}
Xếp loại hiện tại: ${rank || 'Chưa xác định'}

Hãy cung cấp:
1. Nhận xét sư phạm tổng quan (điểm mạnh, môn nổi trội, môn cần cải thiện).
2. Dự báo rủi ro học tập & nguyên nhân khả dĩ.
3. Kế hoạch bồi dưỡng / lộ trình học tập cá nhân hóa 4 tuần cụ thể.
4. Lời khuyên dành cho Giáo viên chủ nhiệm & Phụ huynh để phối hợp.`;

    const text = await generateWithFallback(prompt, EDTECH_SYSTEM_INSTRUCTION, 0.6);
    res.json({ insight: text });
  } catch (error: any) {
    console.error('Student Insight Error:', error);
    res.status(500).json({ error: error.message || 'Lỗi tạo nhận xét học sinh.' });
  }
});

// Setup Vite middleware for development or serve dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
