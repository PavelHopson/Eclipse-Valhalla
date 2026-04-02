// Eclipse Valhalla — Ingestion Engine Entry Point

export { initIngestion, startAutoIngestion, stopAutoIngestion, runSource, runAllSources, getIngestionStatus, getSourceStats } from './ingestionService';
export { runPipeline, createStandardPipeline } from './pipeline';
export type { PipelineContext, PipelineResult, PipelineStats, PipelineStage } from './pipeline';
export { startScheduler, stopScheduler, isSchedulerRunning } from './scheduler';
export { fetchFromSource } from './jobs/fetchJob';
export { isAIAvailable } from './jobs/enrichJob';
export { fetchRSS } from './adapters/rssAdapter';
export { fetchTelegram } from './adapters/telegramAdapter';
export { fetchWebsite } from './adapters/websiteAdapter';
