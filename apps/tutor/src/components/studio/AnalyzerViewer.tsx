import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, FileText, Brain, Lightbulb, CheckCircle2, Loader2, RefreshCcw, BookOpen, Map as MapIcon, X } from 'lucide-react';
import { useResourceStore } from '../../stores/resourceStore';
import { useTeachingStore } from '../../stores/teachingStore';
import { useShallow } from 'zustand/react/shallow';
import { findTopicInfo } from '../../utils/topicUtils';
import type { Topic } from '../../types';

interface AnalyzerViewerProps {
    onNotesGenerated?: () => void;
    onMindMapUpdated?: () => void;
}

export default function AnalyzerViewer({ onNotesGenerated, onMindMapUpdated }: AnalyzerViewerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const {
        analyzedImage,
        isAnalyzing,
        generateImageAnalysis,
        clearAnalysis,
        generateNotes,
        generateMindMap,
        isGeneratingNotes,
        isGeneratingMindMap
    } = useResourceStore(useShallow(state => ({
        analyzedImage: state.analyzedImage,
        isAnalyzing: state.isAnalyzing,
        generateImageAnalysis: state.generateImageAnalysis,
        clearAnalysis: state.clearAnalysis,
        generateNotes: state.generateNotes,
        generateMindMap: state.generateMindMap,
        isGeneratingNotes: state.isGeneratingNotes,
        isGeneratingMindMap: state.isGeneratingMindMap
    })));

    const { currentSession } = useTeachingStore(useShallow(state => ({
        currentSession: state.currentSession
    })));

    const topicContext = useMemo(() => {
        try {
            const info = findTopicInfo(currentSession?.topicId ?? '');
            const topic = info.topic as Topic | null;
            return {
                subjectArea: info.subjectName || undefined,
                gradeLevel: info.streamName || undefined,
                chapterName: info.chapterName,
                topicDescription: topic?.description,
                subjectDescription: info.subjectDescription,
            };
        } catch {
            return {};
        }
    }, [currentSession?.topicId]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        processFile(file);
    };

    const processFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (PNG, JPG, WebP).');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            try {
                await generateImageAnalysis(base64);
            } catch (err) {
                console.error('Analysis failed:', err);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleConvertToNotes = async () => {
        if (!analyzedImage || !currentSession) return;
        
        try {
            const content = [
                `Title: Content from Analyzed Image for ${currentSession.topicName}`,
                `Visual Summary: ${analyzedImage.visualSummary}`,
                `Key Concepts: ${analyzedImage.keyConcepts.join(', ')}`,
                `Extracted Content:\n${analyzedImage.extractedContent}`,
                `Insights: ${analyzedImage.learningInsights.join('. ')}`,
            ];
            
            await generateNotes(currentSession.id, currentSession.topicName, content, {
                ...topicContext,
                keyConcepts: analyzedImage.keyConcepts,
            });
            if (onNotesGenerated) onNotesGenerated();
        } catch (err) {
            console.error('Note generation failed:', err);
        }
    };

    const handleAddToMindMap = async () => {
        if (!analyzedImage || !currentSession) return;

        try {
            await generateMindMap(
                currentSession.id, 
                currentSession.topicName, 
                topicContext.subjectArea || 'General', 
                topicContext.gradeLevel || 'School',
                analyzedImage.keyConcepts,
                [analyzedImage.extractedContent]
            );
            if (onMindMapUpdated) onMindMapUpdated();
        } catch (err) {
            console.error('Mind map generation failed:', err);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
            <AnimatePresence mode="wait">
                {!analyzedImage ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                    >
                        <div 
                            className={`w-full max-w-lg p-12 border-2 border-dashed rounded-[32px] transition-all cursor-pointer ${
                                dragActive ? 'border-[#10b981] bg-[#10b981]/5' : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            
                            <div className="w-20 h-20 bg-[#10b981]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                {isAnalyzing ? (
                                    <Loader2 className="w-10 h-10 text-[#10b981] animate-spin" />
                                ) : (
                                    <Camera className="w-10 h-10 text-[#10b981]" />
                                )}
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                {isAnalyzing ? 'Analyzing your content...' : 'Upload Image to Analyze'}
                            </h3>
                            <p className="text-slate-500 mb-6">
                                Snap a photo of your notes, textbook, or diagram. <br/>
                                Our AI will extract concepts and convert them into study material.
                            </p>
                            
                            {!isAnalyzing && (
                                <div className="flex flex-wrap justify-center gap-2 text-xs font-semibold text-slate-500">
                                    <span className="px-3 py-1.5 bg-slate-100 rounded-full flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Support PNG/JPG
                                    </span>
                                    <span className="px-3 py-1.5 bg-slate-100 rounded-full flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> OCR Extraction
                                    </span>
                                    <span className="px-3 py-1.5 bg-slate-100 rounded-full flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Concept Map
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col min-h-0"
                    >
                        {/* Summary Header */}
                        <div className="bg-white border-b border-slate-200 p-6 flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 shrink-0">
                                    <img src={analyzedImage.imageBase64} alt="Analyzed" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-1">Visual Analysis Complete</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                                        {analyzedImage.visualSummary}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={clearAnalysis}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Scrollable Results */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Key Concepts */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-900 font-bold mb-3">
                                    <Brain className="w-5 h-5 text-purple-500" />
                                    <span>Identified Key Concepts</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {analyzedImage.keyConcepts.map((concept, i) => (
                                        <motion.span 
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="px-4 py-2 bg-white border border-purple-100 rounded-xl text-sm font-medium text-purple-700 shadow-sm"
                                        >
                                            {concept}
                                        </motion.span>
                                    ))}
                                </div>
                            </div>

                            {/* Learning Insights */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-900 font-bold mb-3">
                                    <Lightbulb className="w-5 h-5 text-amber-500" />
                                    <span>Study Insights</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-[Outfit]">
                                    {analyzedImage.learningInsights.map((insight, i) => (
                                        <div key={i} className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50 flex gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                                            <p className="text-sm text-amber-900 leading-relaxed">{insight}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* OCR Content */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-900 font-bold mb-3">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    <span>Extracted Text Content</span>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                    <pre className="text-sm text-slate-600 font-sans whitespace-pre-wrap leading-relaxed">
                                        {analyzedImage.extractedContent}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* Action Tab-bar */}
                        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-center gap-4">
                            <button 
                                onClick={handleConvertToNotes}
                                disabled={isGeneratingNotes}
                                className="flex-1 max-w-[200px] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all disabled:opacity-50"
                            >
                                {isGeneratingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                                <span>Create Notes</span>
                            </button>
                            <button 
                                onClick={handleAddToMindMap}
                                disabled={isGeneratingMindMap}
                                className="flex-1 max-w-[200px] h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all disabled:opacity-50"
                            >
                                {isGeneratingMindMap ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapIcon className="w-4 h-4" />}
                                <span>Add to Mind Map</span>
                            </button>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl flex items-center justify-center transition-all"
                                title="Re-scan another image"
                            >
                                <RefreshCcw className="w-5 h-5" />
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
