import type { Canvas } from 'fabric';
import type { ExportFormat } from '../../types/canvas.types';

const MULTIPLIER = 1;

// 导出格式配置
const EXPORT_CONFIG = {
  png: { extension: 'png', format: 'png' as const, quality: 1 },
  jpeg: { extension: 'jpg', format: 'jpeg' as const, quality: 1 },
  json: { extension: 'json', mimeType: 'application/json' },
  svg: { extension: 'svg', mimeType: 'image/svg+xml' },
} as const;

/**
 * 触发文件下载
 */
function triggerDownload(dataOrUrl: string, filename: string, mimeType?: string): void {
  const link = document.createElement('a');
  document.body.appendChild(link);

  if (mimeType) {
    const blob = new Blob([dataOrUrl], { type: mimeType });
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  } else {
    link.href = dataOrUrl;
    link.download = filename;
    link.click();
  }

  document.body.removeChild(link);
}

/**
 * 导出为图片（PNG/JPEG）
 */
function exportAsImage(canvas: Canvas, format: 'png' | 'jpeg'): string {
  const config = EXPORT_CONFIG[format];
  return canvas.toDataURL({
    format: config.format,
    quality: config.quality,
    multiplier: MULTIPLIER,
  });
}

/**
 * 导出为 JSON
 */
function exportAsJSON(canvas: Canvas): string {
  return JSON.stringify(canvas.toJSON(), null, 2);
}

/**
 * 导出为 SVG
 */
function exportAsSVG(canvas: Canvas): string {
  return canvas.toSVG();
}

/**
 * 导出 Canvas（主函数）
 */
export function exportCanvas(canvas: Canvas, format: ExportFormat): void {
  switch (format) {
    case 'png': {
      const dataUrl = exportAsImage(canvas, 'png');
      triggerDownload(dataUrl, `design.${EXPORT_CONFIG.png.extension}`);
      break;
    }

    case 'jpeg': {
      const dataUrl = exportAsImage(canvas, 'jpeg');
      triggerDownload(dataUrl, `design.${EXPORT_CONFIG.jpeg.extension}`);
      break;
    }

    case 'json': {
      const data = exportAsJSON(canvas);
      triggerDownload(data, `design.${EXPORT_CONFIG.json.extension}`, EXPORT_CONFIG.json.mimeType);
      break;
    }

    case 'svg': {
      const data = exportAsSVG(canvas);
      triggerDownload(data, `design.${EXPORT_CONFIG.svg.extension}`, EXPORT_CONFIG.svg.mimeType);
      break;
    }

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
