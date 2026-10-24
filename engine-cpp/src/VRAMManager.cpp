#include "VRAMManager.hpp"
#include <windows.h>
#include <iostream>
#include <algorithm>

namespace Genux {

VRAMManager::VRAMManager() {
    // Target GPU: RTX 5080 (16GB VRAM)
    m_telemetry.totalVRAMBytes = 16ULL * 1024 * 1024 * 1024;           // 16 GB
    m_telemetry.reservedOSHeadroomBytes = static_cast<size_t>(1.5 * 1024 * 1024 * 1024); // 1.5 GB for DWM/Windows
    m_telemetry.safeCeilingBytes = static_cast<size_t>(14.5 * 1024 * 1024 * 1024);       // 14.5 GB max
    m_telemetry.currentAllocatedBytes = 0;
    m_telemetry.peakAllocatedBytes = 0;
    m_telemetry.currentStage = PipelineStage::Idle;
    m_telemetry.currentStageName = "Idle";
    m_telemetry.fp8Enabled = true;
}

VRAMManager& VRAMManager::getInstance() {
    static VRAMManager instance;
    return instance;
}

VRAMTelemetry VRAMManager::getTelemetry() {
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_telemetry;
}

bool VRAMManager::acquireStageVRAM(PipelineStage stage, size_t requestedBytes) {
    std::lock_guard<std::mutex> lock(m_mutex);

    // Verify requested allocation fits inside the 14.5 GB safe ceiling
    if (requestedBytes > m_telemetry.safeCeilingBytes) {
        std::cerr << "[VRAMManager] ERROR: Requested " << (requestedBytes / (1024 * 1024))
                  << " MB exceeds strict 14.5 GB safety limit!\n";
        return false;
    }

    // Free previously active stage allocation to simulate sequential offload to pinned DDR5
    m_telemetry.currentAllocatedBytes = requestedBytes;
    m_telemetry.peakAllocatedBytes = std::max(m_telemetry.peakAllocatedBytes, requestedBytes);
    m_telemetry.currentStage = stage;

    switch (stage) {
        case PipelineStage::Segmentation_SAM2:
            m_telemetry.currentStageName = "SAM 2.1 Interactive Tracking (FP16)";
            break;
        case PipelineStage::CleanPlate_ProPainter:
            m_telemetry.currentStageName = "ProPainter Clean Plate Inpainting";
            break;
        case PipelineStage::Motion_DWPose_LivePortrait:
            m_telemetry.currentStageName = "DWPose + LivePortrait Lip/Eye Sync";
            break;
        case PipelineStage::Director_Gemma4:
            m_telemetry.currentStageName = "Gemma 4 Director Agent (llama.cpp)";
            break;
        case PipelineStage::Synthesis_Wan21_FP8:
            m_telemetry.currentStageName = "Wan 2.1 V2V 14B FP8 Blackwell TensorRT";
            break;
        case PipelineStage::Interpolation_RIFE:
            m_telemetry.currentStageName = "RIFE v4.22 60 FPS Frame Interpolation";
            break;
        default:
            m_telemetry.currentStageName = "Idle";
            break;
    }

    return true;
}

void VRAMManager::releaseStageVRAM(PipelineStage /*stage*/) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_telemetry.currentAllocatedBytes = 0;
    m_telemetry.currentStage = PipelineStage::Idle;
    m_telemetry.currentStageName = "Idle (Weights Offloaded to DDR5)";
}

void* VRAMManager::allocatePinnedHostMemory(size_t bytes) {
    // In production with CUDA: cudaMallocHost(&ptr, bytes)
    // Fallback: standard virtual memory allocation with VirtualAlloc
    return ::VirtualAlloc(NULL, bytes, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
}

void VRAMManager::freePinnedHostMemory(void* ptr) {
    if (ptr) {
        ::VirtualFree(ptr, 0, MEM_RELEASE);
    }
}

bool VRAMManager::canAllocateTemporalTile(size_t width, size_t height, size_t frameChunk) {
    // Latent calculation: (B x C x F/4 x H/8 x W/8) * FP8 (1 byte per elem)
    size_t latentBytes = 1 * 16 * (frameChunk / 4) * (height / 8) * (width / 8);
    // Buffer overhead + KV cache
    size_t totalRequired = latentBytes * 8; 
    return (totalRequired < (2ULL * 1024 * 1024 * 1024)); // Less than 2 GB per temporal tile
}

} // namespace Genux
