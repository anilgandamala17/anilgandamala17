import { motion } from 'framer-motion';
import type { GeneratedSummary } from '../../types';
import { BookOpen, CheckCircle2, Link, Download, Share2, FileText } from 'lucide-react';
import { ExportService } from '../../services/exportService';

interface SummaryViewerProps {
    summary: GeneratedSummary;
}

export default function SummaryViewer({ summary }: SummaryViewerProps) {
    const handleDownloadPDF = async () => {
        await ExportService.exportSummaryToPDF(summary);
    };

    const handleDownloadDOCX = async () => {
        await ExportService.exportSummaryToDOCX(summary);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 overflow-hidden"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-80" />
                <h2 className="text-2xl font-bold mb-1">{summary.title}</h2>
                <p className="text-blue-100 text-sm">Key concepts and takeaways at a glance</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Overview */}
                <section>
                    <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Overview</h3>
                    <p className="text-gray-700 dark:text-slate-200 leading-relaxed bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                        {summary.overview}
                    </p>
                </section>

                {/* Takeaways */}
                <section>
                    <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Key Takeaways</h3>
                    <div className="grid gap-3">
                        {summary.keyTakeaways.map((takeaway, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-start gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100/50 dark:border-indigo-900/20"
                            >
                                <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-slate-200 text-sm">{takeaway}</span>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Further Reading */}
                {summary.furtherReading && summary.furtherReading.length > 0 && (
                    <section>
                        <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Further Reading</h3>
                        <ul className="space-y-2">
                            {summary.furtherReading.map((reading, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                    <Link className="w-4 h-4" />
                                    {reading}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Actions */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-slate-800">
                    <p className="text-xs text-gray-400 dark:text-slate-500">Generated on {new Date(summary.createdAt).toLocaleDateString()}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-blue-300 transition-all text-gray-700 dark:text-slate-200 shadow-sm"
                            title="Download PDF"
                        >
                            <Download className="w-4 h-4 text-blue-500" />
                            PDF
                        </button>
                        <button
                            onClick={handleDownloadDOCX}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-blue-300 transition-all text-gray-700 dark:text-slate-200 shadow-sm"
                            title="Download DOCX"
                        >
                            <FileText className="w-4 h-4 text-blue-600" />
                            DOCX
                        </button>
                        <button
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-400 dark:text-slate-500"
                            title="Share Summary"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
