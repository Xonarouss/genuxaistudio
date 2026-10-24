#pragma once

#include <string>
#include <vector>
#include <filesystem>

namespace Genux {

struct DirectorScenePlan {
    std::string enhancedDiffusionPrompt;
    std::string negativePrompt;
    std::string lightingHarmonizationNotes;
    float sam2MaskWeight;
    float dwposePoseWeight;
    float depthMapWeight;
    float faceIdFidelityWeight;
    bool enableLensDistortionMatching;
};

class GemmaDirector {
public:
    GemmaDirector();
    ~GemmaDirector() = default;

    // Load Gemma 4 GGUF (Q4_K_M or Q8_0) into llama.cpp CUDA backend
    bool initialize(const std::filesystem::path& modelPath);

    // Direct scene conditioning analysis
    DirectorScenePlan directScene(
        const std::string& userPrompt,
        const std::string& sceneCategory,
        double clipDurationSeconds,
        int videoWidth,
        int videoHeight
    );

    bool isLoaded() const { return m_isLoaded; }

private:
    bool m_isLoaded{false};
    std::filesystem::path m_modelPath;
};

} // namespace Genux
