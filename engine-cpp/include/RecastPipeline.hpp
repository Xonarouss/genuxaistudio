#pragma once

#include <string>
#include <filesystem>
#include <functional>
#include <vector>
#include "VRAMManager.hpp"
#include "GemmaDirector.hpp"

namespace Genux {

struct RecastJobConfig {
    std::filesystem::path sourceVideoPath;
    std::filesystem::path characterVaultRecordPath; // .gchar file
    std::string userPrompt;
    int targetClickX;
    int targetClickY;
    int durationSeconds;      // 5 to 60 seconds
    bool enableRIFE60fps;
    bool enableFP8Quantization;
    bool enableTiledVAE;
    std::filesystem::path outputVideoPath;
};

struct PipelineTelemetry {
    int currentStageIndex;    // 1 to 5
    std::string stageName;
    int overallProgressPct;
    std::string logLine;
    double currentVRAM_GB;
    double fpsTelemetry;
};

using PipelineProgressCallback = std::function<void(const PipelineTelemetry&)>;

class RecastPipeline {
public:
    RecastPipeline();
    ~RecastPipeline() = default;

    // Execute full 5-stage recasting pipeline with sliding-window temporal chunking
    bool executeRecast(
        const RecastJobConfig& config,
        PipelineProgressCallback callback
    );

private:
    // Stage 1: SAM 2.1 Interactive Mask & ProPainter Clean Plate
    bool runStage1_SegmentationAndCleanPlate(const RecastJobConfig& config, PipelineProgressCallback callback);

    // Stage 2: Motion, Depth & LivePortrait Extraction
    bool runStage2_MotionAndDepth(const RecastJobConfig& config, PipelineProgressCallback callback);

    // Stage 3: Gemma 4 Director Scene Conditioning
    bool runStage3_GemmaDirector(const RecastJobConfig& config, DirectorScenePlan& outPlan, PipelineProgressCallback callback);

    // Stage 4: Character Vault InstantID + PuLID Embedding Injection
    bool runStage4_VaultEmbeddingInjection(const RecastJobConfig& config, PipelineProgressCallback callback);

    // Stage 5: Wan 2.1 FP8 TensorRT Diffusion & RIFE 60fps Synthesis
    bool runStage5_SynthesisAndInterpolation(const RecastJobConfig& config, const DirectorScenePlan& plan, PipelineProgressCallback callback);
};

} // namespace Genux
