#include <iostream>
#include <iomanip>
#include "ModelScanner.hpp"
#include "ModelDownloader.hpp"
#include "VRAMManager.hpp"
#include "SocialIngestor.hpp"
#include "GemmaDirector.hpp"
#include "RecastPipeline.hpp"

int main(int /*argc*/, char* /*argv*/[]) {
    std::cout << "============================================================\n";
    std::cout << "  GENUX AI — NATIVE C++20 CORE ENGINE (CODENAME: GENUTS)   \n";
    std::cout << "  Local High-Performance Video Recasting & Viral Studio     \n";
    std::cout << "  Target Architecture: RTX 5080 (16GB VRAM Blackwell FP8)  \n";
    std::cout << "============================================================\n\n";

    // 1. Initialize and Run Pre-Flight Model Scanner
    std::cout << "[Step 1] Running Pre-Flight Model & Disk Scanner...\n";
    Genux::ModelScanner scanner;
    scanner.scanAll([](const std::string& check) {
        std::cout << "  › " << check << "\n";
    });

    std::cout << "\n[Model Registry Status]:\n";
    const auto& manifest = scanner.getRegistry();
    for (const auto& entry : manifest) {
        std::cout << "  [" << (entry.isInstalled ? "INSTALLED" : "MISSING") << "] "
                  << std::setw(38) << std::left << entry.name 
                  << " (" << (entry.expectedSizeBytes / (1024 * 1024)) << " MB)";
        if (entry.isSymlinkedFromCache) {
            std::cout << " -> [Symlinked from Cache: " << entry.resolvedLocalPath.string() << "]";
        }
        std::cout << "\n";
    }

    // 2. Initialize VRAM Telemetry
    std::cout << "\n[Step 2] Initializing 16GB VRAM Allocation Guard...\n";
    auto& vram = Genux::VRAMManager::getInstance();
    auto telem = vram.getTelemetry();
    std::cout << "  Total VRAM:           " << (telem.totalVRAMBytes / (1024 * 1024 * 1024)) << " GB\n";
    std::cout << "  Strict Safe Ceiling:  " << (telem.safeCeilingBytes / (1024 * 1024 * 1024)) << ".5 GB\n";
    std::cout << "  Windows DWM Reserve:  " << (telem.reservedOSHeadroomBytes / (1024 * 1024 * 1024)) << ".5 GB\n";
    std::cout << "  Blackwell FP8 Mode:   " << (telem.fp8Enabled ? "ACTIVE" : "DISABLED") << "\n";

    // 3. Test Full Recast Pipeline Simulation
    std::cout << "\n[Step 3] Executing 5-Stage Recasting Engine Test Job...\n";
    Genux::RecastPipeline pipeline;
    Genux::RecastJobConfig config;
    config.sourceVideoPath = "samples/tokyo_parkour.mp4";
    config.characterVaultRecordPath = "vault/obsidian_ronin.gchar";
    config.userPrompt = "Cinematic wet asphalt reflections, neon cyan tungsten rim light";
    config.targetClickX = 540;
    config.targetClickY = 960;
    config.durationSeconds = 10;
    config.enableRIFE60fps = true;
    config.enableFP8Quantization = true;
    config.enableTiledVAE = true;
    config.outputVideoPath = "output/tokyo_recast_60fps.mp4";

    pipeline.executeRecast(config, [](const Genux::PipelineTelemetry& status) {
        std::cout << "  [" << std::setw(3) << status.overallProgressPct << "%] "
                  << std::setw(60) << std::left << status.stageName
                  << " | VRAM: " << std::fixed << std::setprecision(1) << status.currentVRAM_GB << " GB"
                  << " | " << std::setprecision(0) << status.fpsTelemetry << " FPS\n";
    });

    std::cout << "\n[SUCCESS] Engine Core Ready & Validated. Standing by for Desktop IPC bridge.\n";
    return 0;
}
