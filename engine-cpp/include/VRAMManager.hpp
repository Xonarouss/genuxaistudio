#pragma once

#include <cstdint>
#include <string>
#include <mutex>

namespace Genux {

enum class PipelineStage {
    Idle,
    Segmentation_SAM2,
    CleanPlate_ProPainter,
    Motion_DWPose_LivePortrait,
    Director_Gemma4,
    Synthesis_Wan21_FP8,
    Interpolation_RIFE
};

struct VRAMTelemetry {
    size_t totalVRAMBytes;          // 16 GB = 17,179,869,184 bytes
    size_t reservedOSHeadroomBytes; // 1.5 GB = 1,610,612,736 bytes
    size_t safeCeilingBytes;        // 14.5 GB = 15,569,256,448 bytes
    size_t currentAllocatedBytes;
    size_t peakAllocatedBytes;
    PipelineStage currentStage;
    std::string currentStageName;
    bool fp8Enabled;
};

class VRAMManager {
public:
    static VRAMManager& getInstance();

    // Query telemetry
    VRAMTelemetry getTelemetry();

    // Stage Memory Lifecycle: Acquires VRAM for target stage, automatically offloading previous stage to pinned DDR5
    bool acquireStageVRAM(PipelineStage stage, size_t requestedBytes);
    void releaseStageVRAM(PipelineStage stage);

    // Dynamic Host-to-Device streaming buffers
    void* allocatePinnedHostMemory(size_t bytes);
    void freePinnedHostMemory(void* ptr);

    // Tiled VAE Spatio-Temporal safety check
    bool canAllocateTemporalTile(size_t width, size_t height, size_t frameChunk);

private:
    VRAMManager();
    ~VRAMManager() = default;

    std::mutex m_mutex;
    VRAMTelemetry m_telemetry;
};

} // namespace Genux
