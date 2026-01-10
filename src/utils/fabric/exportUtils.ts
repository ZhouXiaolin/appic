import type { Canvas } from 'fabric';
import type { ExportOptions, ExportFormat } from '../../types/canvas.types';

/**
 * 导出为图片（PNG/JPEG）
 */
function exportAsImage(canvas: Canvas, options: ExportOptions): string {
  const format = options.format === 'jpeg' ? 'jpeg' : 'png';
  return canvas.toDataURL({
    format,
    quality: options.quality || 1,
    multiplier: options.multiplier || 2,
  });
}

/**
 * 导出为 JSON
 */
function exportAsJSON(canvas: Canvas): string {
  const json = canvas.toJSON();
  return JSON.stringify(json, null, 2);
}

/**
 * 导出为 SVG
 */
function exportAsSVG(canvas: Canvas): string {
  return canvas.toSVG();
}

/**
 * 下载文件（用于文本数据：JSON、SVG）
 */
function downloadTextFile(data: string, filename: string, mimeType: string): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 下载图片（用于 Data URL）
 */
function downloadImageFile(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 导出 Canvas（主函数）
 */
export function exportCanvas(canvas: Canvas, format: ExportFormat): void {
  switch (format) {
    case 'png':
      const pngData = exportAsImage(canvas, { format: 'png', quality: 1, multiplier: 2 });
      downloadImageFile(pngData, 'design.png');
      break;

    case 'jpeg':
      const jpegData = exportAsImage(canvas, { format: 'jpeg', quality: 1, multiplier: 2 });
      downloadImageFile(jpegData, 'design.jpg');
      break;

    case 'json':
      const jsonData = exportAsJSON(canvas);
      downloadTextFile(jsonData, 'design.json', 'application/json');
      break;

    case 'svg':
      const svgData = exportAsSVG(canvas);
      downloadTextFile(svgData, 'design.svg', 'image/svg+xml');
      break;

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * 从 JSON 加载 Canvas
 */
export function loadFromJSON(canvas: Canvas, json: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      canvas.loadFromJSON(JSON.parse(json), () => {
        canvas.requestRenderAll();
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}
