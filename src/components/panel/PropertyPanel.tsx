/**
 * 右侧属性面板
 * 分组显示：类型、Position、Layout、Appearance、Fill、Stroke、Effects、Export
 */

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { FabricObject } from "fabric";

interface PropertyPanelProps {
	selectedObject: FabricObject | null;
	isDragging?: boolean;
}

type PropertySection =
	| "type"
	| "position"
	| "layout"
	| "appearance"
	| "fill"
	| "stroke"
	| "effects"
	| "export"
	| "text";

const SECTIONS: { id: PropertySection; label: string }[] = [
	{ id: "type", label: "类型" },
	{ id: "position", label: "Position" },
	{ id: "layout", label: "Layout" },
	{ id: "appearance", label: "Appearance" },
	{ id: "fill", label: "Fill" },
	{ id: "stroke", label: "Stroke" },
	{ id: "effects", label: "Effects" },
	{ id: "export", label: "Export" },
	{ id: "text", label: "文本" },
];

export function PropertyPanel({
	selectedObject,
	isDragging = false,
}: PropertyPanelProps) {
	const [expandedSections, setExpandedSections] = useState<
		Set<PropertySection>
	>(new Set(["type", "position", "layout"]));
	// 在拖动时使用缓存的属性值，避免频繁更新
	const [cachedProps, setCachedProps] = useState({
		left: 0,
		top: 0,
		scaleX: 1,
		scaleY: 1,
		angle: 0,
	});

	// 用于强制更新UI
	const [, setTick] = useState(0);

	const isText = selectedObject?.type === "textbox";

	// 只在非拖动状态时更新缓存的属性值
	useEffect(() => {
		if (!isDragging && selectedObject) {
			setCachedProps({
				left: selectedObject.left ?? 0,
				top: selectedObject.top ?? 0,
				scaleX: selectedObject.scaleX ?? 1,
				scaleY: selectedObject.scaleY ?? 1,
				angle: selectedObject.angle ?? 0,
			});
		}
	}, [selectedObject, isDragging]);

	// 当选中文本对象时，自动展开文本section
	useEffect(() => {
		if (isText && selectedObject) {
			setExpandedSections((prev) => {
				if (prev.has("text")) return prev;
				return new Set([...prev, "text"]);
			});
		}
	}, [isText]);

	const toggleSection = useCallback((sectionId: PropertySection) => {
		setExpandedSections((prev) => {
			const next = new Set(prev);
			if (next.has(sectionId)) {
				next.delete(sectionId);
			} else {
				next.add(sectionId);
			}
			return next;
		});
	}, []);

	const handlePropertyChange = useCallback(
		(property: string, value: unknown) => {
			if (!selectedObject) return;

			selectedObject.set(property, value);
			selectedObject.canvas?.requestRenderAll();
			// 强制触发重渲染，确保输入框值同步更新
			setTick((t) => t + 1);
		},
		[selectedObject]
	);

	// 获取拖动状态下的属性值
	const getProp = <K extends keyof typeof cachedProps>(
		key: K,
		fallback: number
	): number => {
		if (isDragging) return cachedProps[key];
		return (selectedObject?.[key] as number) ?? fallback;
	};

	if (!selectedObject) {
		return (
			<div className="w-80 bg-white border-l border-gray-200 p-6">
				<div className="text-center text-gray-500 text-sm py-8">
					未选中任何对象
					<br />
					点击画布上的元素进行编辑
				</div>
			</div>
		);
	}

	return (
		<div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
			{SECTIONS.filter((section) => section.id !== "text" || isText).map(
				(section) => {
					const isExpanded = expandedSections.has(section.id);

					return (
						<div key={section.id} className="border-b border-gray-200">
							{/* Section Header */}
							<button
								onClick={() => toggleSection(section.id)}
								className="w-full flex items-center justify-between px-4 py-3
                         hover:bg-gray-50 transition-colors"
							>
								<span className="text-sm font-semibold text-gray-700">
									{section.label}
								</span>
								{isExpanded ? (
									<ChevronDown className="w-4 h-4 text-gray-500" />
								) : (
									<ChevronRight className="w-4 h-4 text-gray-500" />
								)}
							</button>

							{/* Section Content */}
							{isExpanded && (
								<div className="px-4 pb-4 space-y-3">
									{section.id === "type" && (
										<div className="text-sm text-gray-700 capitalize">
											<strong>类型:</strong> {selectedObject.type}
										</div>
									)}

									{section.id === "position" && (
										<div className="grid grid-cols-2 gap-2">
											<div>
												<label className="block text-xs text-gray-500 mb-1">
													X
												</label>
												<input
													type="number"
													value={Math.round(getProp("left", 0))}
													onChange={(e) =>
														handlePropertyChange("left", Number(e.target.value))
													}
													className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</div>
											<div>
												<label className="block text-xs text-gray-500 mb-1">
													Y
												</label>
												<input
													type="number"
													value={Math.round(getProp("top", 0))}
													onChange={(e) =>
														handlePropertyChange("top", Number(e.target.value))
													}
													className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</div>
										</div>
									)}

									{section.id === "layout" && (
										<div className="grid grid-cols-2 gap-2">
											<div>
												<label className="block text-xs text-gray-500 mb-1">
													宽度
												</label>
												<input
													type="number"
													value={Math.round(
														(selectedObject.width ?? 0) * getProp("scaleX", 1)
													)}
													onChange={(e) => {
														const newScaleX =
															Number(e.target.value) /
															(selectedObject.width ?? 1);
														handlePropertyChange("scaleX", newScaleX);
													}}
													className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</div>
											<div>
												<label className="block text-xs text-gray-500 mb-1">
													高度
												</label>
												<input
													type="number"
													value={Math.round(
														(selectedObject.height ?? 0) * getProp("scaleY", 1)
													)}
													onChange={(e) => {
														const newScaleY =
															Number(e.target.value) /
															(selectedObject.height ?? 1);
														handlePropertyChange("scaleY", newScaleY);
													}}
													className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</div>
											<div>
												<label className="block text-xs text-gray-500 mb-1">
													旋转 (°)
												</label>
												<input
													type="number"
													value={Math.round(getProp("angle", 0) % 360)}
													onChange={(e) =>
														handlePropertyChange(
															"angle",
															Number(e.target.value)
														)
													}
													className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</div>
										</div>
									)}

									{section.id === "appearance" && (
										<div className="space-y-3">
											<div>
												<label className="block text-xs text-gray-500 mb-1">
													透明度
												</label>
												<input
													type="range"
													min="0"
													max="1"
													step="0.1"
													value={selectedObject.opacity ?? 1}
													onChange={(e) =>
														handlePropertyChange(
															"opacity",
															Number(e.target.value)
														)
													}
													className="w-full"
												/>
											</div>
										</div>
									)}

									{section.id === "fill" && (
										<div>
											<label className="block text-xs text-gray-500 mb-1">
												填充颜色
											</label>
											<input
												type="color"
												value={(selectedObject.fill as string) ?? "#000000"}
												onChange={(e) =>
													handlePropertyChange("fill", e.target.value)
												}
												className="w-full h-10 rounded cursor-pointer border border-gray-300"
											/>
										</div>
									)}

									{section.id === "stroke" && (
										<div className="space-y-3">
											<div>
												<label className="block text-xs text-gray-500 mb-1">
													描边颜色
												</label>
												<input
													type="color"
													value={(selectedObject.stroke as string) ?? "#000000"}
													onChange={(e) =>
														handlePropertyChange("stroke", e.target.value)
													}
													className="w-full h-10 rounded cursor-pointer border border-gray-300"
												/>
											</div>
											<div>
												<label className="block text-xs text-gray-500 mb-1">
													描边宽度
												</label>
												<input
													type="number"
													min="0"
													max="50"
													value={selectedObject.strokeWidth ?? 0}
													onChange={(e) =>
														handlePropertyChange(
															"strokeWidth",
															Number(e.target.value)
														)
													}
													className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</div>
										</div>
									)}

									{section.id === "effects" && (
										<div className="space-y-3">
											<div>
												<label className="block text-xs text-gray-500 mb-1">
													阴影
												</label>
												<select
													value={selectedObject.shadow ? "yes" : "no"}
													onChange={(e) => {
														if (e.target.value === "yes") {
															handlePropertyChange("shadow", {
																color: "rgba(0,0,0,0.3)",
																blur: 10,
																offsetX: 5,
																offsetY: 5,
															});
														} else {
															handlePropertyChange("shadow", null);
														}
													}}
													className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
												>
													<option value="no">无</option>
													<option value="yes">启用</option>
												</select>
											</div>
										</div>
									)}

									{section.id === "export" && (
										<div className="text-xs text-gray-500">
											此对象将随设计一起导出
										</div>
									)}

									{section.id === "text" && (
										<div className="space-y-3">
											<div>
												<label className="block text-xs text-gray-500 mb-1">
													文本内容
												</label>
												<textarea
													key={(selectedObject as any).id || "text"}
													defaultValue={(selectedObject as any).text ?? ""}
													onChange={(e) =>
														handlePropertyChange("text", e.target.value)
													}
													className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500
                                 resize-none"
													rows={3}
													placeholder="输入文本内容"
												/>
											</div>
											<div>
												<label className="block text-xs text-gray-500 mb-1">
													字号
												</label>
												<input
													type="number"
													min="8"
													max="200"
													value={(selectedObject as any).fontSize ?? 24}
													onChange={(e) =>
														handlePropertyChange(
															"fontSize",
															Number(e.target.value)
														)
													}
													className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</div>
											<div>
												<label className="block text-xs text-gray-500 mb-1">
													字体
												</label>
												<select
													value={(selectedObject as any).fontFamily ?? "Arial"}
													onChange={(e) =>
														handlePropertyChange("fontFamily", e.target.value)
													}
													className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
												>
													<option value="Arial">Arial</option>
													<option value="Helvetica">Helvetica</option>
													<option value="Times New Roman">
														Times New Roman
													</option>
													<option value="Georgia">Georgia</option>
													<option value="Courier New">Courier New</option>
												</select>
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					);
				}
			)}
		</div>
	);
}
