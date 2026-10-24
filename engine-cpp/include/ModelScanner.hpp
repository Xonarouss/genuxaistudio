#pragma once

#include <string>
#include <vector>
#include <filesystem>
#include <optional>
#include <functional>

namespace Genux {

enum class ModelCategory {
    CoreBinaries,
    Segmentation,
    Motion,
    CharacterVault,
    DirectorLLM,
    SynthesisVideo
};

struct ModelEntry {
    std::string id;
    std::string name;
    ModelCategory category;
    std::string upstreamUrl;
    std::string expectedSha256;
    uint64_t expectedSizeBytes;
    std::filesystem::path localTargetRelPath;
    bool isInstalled;
    bool isSymlinkedFromCache;
    std::filesystem::path resolvedLocalPath;
};

class ModelScanner {
public:
    ModelScanner();
    ~ModelScanner() = default;

    // Set custom extra search paths (e.g. D:/ComfyUI/models or custom HF cache)
    void addSearchPath(const std::filesystem::path& path);

    // Run deep scan across local paths, ComfyUI, Ollama, HuggingFace caches
    void scanAll(std::function<void(const std::string& currentCheck)> onProgress = nullptr);

    // Fast SHA-256 validation (checks first 64KB + full file hash)
    static std::string calculateSHA256(const std::filesystem::path& filePath);

    // Access registry
    const std::vector<ModelEntry>& getRegistry() const { return m_manifest; }
    std::vector<ModelEntry> getMissingModels() const;
    bool isPipelineReady() const;

    // Create symlink from external cache to Genux local model directory
    bool symlinkModel(const std::string& modelId, const std::filesystem::path& existingPath);

private:
    void initManifest();
    std::vector<std::filesystem::path> detectCommonCachePaths();

    std::vector<ModelEntry> m_manifest;
    std::vector<std::filesystem::path> m_searchPaths;
    std::filesystem::path m_appDataModelRoot;
};

} // namespace Genux
