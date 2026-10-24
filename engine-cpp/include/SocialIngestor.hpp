#pragma once

#include <string>
#include <vector>
#include <filesystem>
#include <functional>

namespace Genux {

struct VideoStreamMeta {
    std::filesystem::path localFilePath;
    int width;
    int height;
    double fps;
    int totalFrames;
    double durationSeconds;
    std::string codec;
    std::vector<int> sceneCutFrameIndices;
};

class SocialIngestor {
public:
    SocialIngestor();
    ~SocialIngestor() = default;

    // Download video stream from TikTok, Reels, YouTube Shorts
    bool ingestUrl(
        const std::string& url,
        const std::filesystem::path& outputDir,
        std::string& outLocalPath,
        std::function<void(const std::string& status)> progressCallback = nullptr
    );

    // Extract stream metadata & detect scene cuts using FFmpeg
    bool inspectStream(
        const std::filesystem::path& videoPath,
        VideoStreamMeta& outMeta
    );

    // Initialize NVDEC hardware decoder for zero-copy frame access
    bool initNVDECDecoder(const std::filesystem::path& videoPath);
    void closeNVDECDecoder();

private:
    std::filesystem::path m_ytdlpPath;
    std::filesystem::path m_ffmpegPath;
};

} // namespace Genux
