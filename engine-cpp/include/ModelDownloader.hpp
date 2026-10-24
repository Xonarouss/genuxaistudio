#pragma once

#include <string>
#include <filesystem>
#include <functional>
#include <atomic>
#include <thread>
#include <vector>

namespace Genux {

struct DownloadProgress {
    std::string modelId;
    uint64_t bytesDownloaded;
    uint64_t totalBytes;
    double speedMBps;
    double etaSeconds;
    bool isComplete;
    bool hasError;
    std::string errorMessage;
};

using DownloadProgressCallback = std::function<void(const DownloadProgress&)>;

class ModelDownloader {
public:
    ModelDownloader();
    ~ModelDownloader();

    // Async download from official GitHub Releases or HuggingFace with HTTP Range support
    bool downloadAsync(
        const std::string& modelId,
        const std::string& url,
        const std::filesystem::path& destinationPath,
        const std::string& expectedSha256,
        DownloadProgressCallback callback
    );

    // Cancel an ongoing download
    void cancel(const std::string& modelId);
    void cancelAll();

    bool isDownloading(const std::string& modelId) const;

private:
    struct DownloadTask {
        std::string modelId;
        std::atomic<bool> cancelRequested{false};
        std::thread workerThread;
    };

    std::vector<std::unique_ptr<DownloadTask>> m_activeTasks;
};

} // namespace Genux
