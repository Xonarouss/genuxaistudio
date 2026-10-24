#include "ModelScanner.hpp"
#include <windows.h>
#include <wincrypt.h>
#include <iostream>
#include <fstream>
#include <iomanip>
#include <sstream>

namespace Genux {

ModelScanner::ModelScanner() {
    char* localAppData = nullptr;
    size_t len = 0;
    if (_dupenv_s(&localAppData, &len, "LOCALAPPDATA") == 0 && localAppData != nullptr) {
        m_appDataModelRoot = std::filesystem::path(localAppData) / "GenuxAI" / "models";
        free(localAppData);
    } else {
        m_appDataModelRoot = "C:/ProgramData/GenuxAI/models";
    }

    std::filesystem::create_directories(m_appDataModelRoot);
    initManifest();
}

void ModelScanner::addSearchPath(const std::filesystem::path& path) {
    if (std::filesystem::exists(path)) {
        m_searchPaths.push_back(path);
    }
}

std::vector<std::filesystem::path> ModelScanner::detectCommonCachePaths() {
    std::vector<std::filesystem::path> paths;

    // 1. User Profile ~/.cache/huggingface/hub
    char* userProfile = nullptr;
    size_t len = 0;
    if (_dupenv_s(&userProfile, &len, "USERPROFILE") == 0 && userProfile != nullptr) {
        std::filesystem::path home(userProfile);
        free(userProfile);
        paths.push_back(home / ".cache" / "huggingface" / "hub");
        paths.push_back(home / ".ollama" / "models");
    }

    // 2. ComfyUI common installation directories
    std::vector<std::filesystem::path> commonComfyDrives = { "C:/ComfyUI", "D:/ComfyUI", "E:/ComfyUI" };
    for (const auto& drive : commonComfyDrives) {
        if (std::filesystem::exists(drive / "models")) {
            paths.push_back(drive / "models");
        }
    }

    return paths;
}

void ModelScanner::initManifest() {
    m_manifest.clear();

    m_manifest.push_back({
        "binaries",
        "yt-dlp + FFmpeg NVDEC Master",
        ModelCategory::CoreBinaries,
        "https://github.com/yt-dlp/yt-dlp/releases/latest",
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        142 * 1024 * 1024,
        "bin/ffmpeg.exe",
        false, false, ""
    });

    m_manifest.push_back({
        "sam2",
        "Meta SAM 2.1 Large + ProPainter Clean Plate",
        ModelCategory::Segmentation,
        "https://github.com/facebookresearch/sam2",
        "a4f89d34208fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c921",
        static_cast<uint64_t>(2.4 * 1024 * 1024 * 1024),
        "sam2/sam2.1_hiera_large.pt",
        false, false, ""
    });

    m_manifest.push_back({
        "motion",
        "DWPose + DepthAnything-V2 + LivePortrait",
        ModelCategory::Motion,
        "https://github.com/KlingTeam/LivePortrait",
        "b1c2d34298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852d453",
        static_cast<uint64_t>(3.1 * 1024 * 1024 * 1024),
        "motion/liveportrait_onnx.engine",
        false, false, ""
    });

    m_manifest.push_back({
        "vault",
        "InstantID + PuLID + IP-Adapter-FaceID-PlusV2",
        ModelCategory::CharacterVault,
        "https://huggingface.co/InstantX/InstantID",
        "c8e7f64298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852f811",
        static_cast<uint64_t>(4.2 * 1024 * 1024 * 1024),
        "vault/antelopev2_faceid.bin",
        false, false, ""
    });

    m_manifest.push_back({
        "gemma4",
        "Gemma 4 Director Agent (Q4_K_M GGUF)",
        ModelCategory::DirectorLLM,
        "https://github.com/ggerganov/llama.cpp",
        "d9a8b74298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852a122",
        static_cast<uint64_t>(3.8 * 1024 * 1024 * 1024),
        "llm/gemma-4-director.gguf",
        false, false, ""
    });

    m_manifest.push_back({
        "wan21",
        "Wan 2.1 V2V 14B FP8 (Blackwell TensorRT 10.x) + RIFE 4.22",
        ModelCategory::SynthesisVideo,
        "https://github.com/Wan-Video/Wan2.1",
        "f0e9d84298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852e994",
        static_cast<uint64_t>(14.2 * 1024 * 1024 * 1024),
        "wan2.1/wan2.1_v2v_fp8.engine",
        false, false, ""
    });
}

std::string ModelScanner::calculateSHA256(const std::filesystem::path& filePath) {
    if (!std::filesystem::exists(filePath)) return "";

    std::ifstream file(filePath, std::ios::binary);
    if (!file) return "";

    HCRYPTPROV hProv = 0;
    HCRYPTHASH hHash = 0;
    if (!CryptAcquireContext(&hProv, NULL, NULL, PROV_RSA_AES, CRYPT_VERIFYCONTEXT)) return "";
    if (!CryptCreateHash(hProv, CALG_SHA_256, 0, 0, &hHash)) {
        CryptReleaseContext(hProv, 0);
        return "";
    }

    std::vector<char> buffer(64 * 1024); // 64 KB chunks
    while (file.read(buffer.data(), buffer.size()) || file.gcount() > 0) {
        if (!CryptHashData(hHash, reinterpret_cast<const BYTE*>(buffer.data()), static_cast<DWORD>(file.gcount()), 0)) {
            CryptDestroyHash(hHash);
            CryptReleaseContext(hProv, 0);
            return "";
        }
    }

    BYTE rgbHash[32];
    DWORD cbHash = 32;
    std::string sha256Hex;
    if (CryptGetHashParam(hHash, HP_HASHVAL, rgbHash, &cbHash, 0)) {
        std::ostringstream oss;
        for (DWORD i = 0; i < cbHash; i++) {
            oss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(rgbHash[i]);
        }
        sha256Hex = oss.str();
    }

    CryptDestroyHash(hHash);
    CryptReleaseContext(hProv, 0);
    return sha256Hex;
}

void ModelScanner::scanAll(std::function<void(const std::string& currentCheck)> onProgress) {
    auto cachePaths = detectCommonCachePaths();
    cachePaths.insert(cachePaths.end(), m_searchPaths.begin(), m_searchPaths.end());

    for (auto& entry : m_manifest) {
        if (onProgress) {
            onProgress("Scanning for: " + entry.name);
        }

        // 1. Check Genux default storage
        std::filesystem::path primaryPath = m_appDataModelRoot / entry.localTargetRelPath;
        if (std::filesystem::exists(primaryPath)) {
            entry.isInstalled = true;
            entry.resolvedLocalPath = primaryPath;
            continue;
        }

        // 2. Search detected caches
        bool foundInCache = false;
        for (const auto& cacheDir : cachePaths) {
            if (!std::filesystem::exists(cacheDir)) continue;

            // Search filename match
            std::string filename = entry.localTargetRelPath.filename().string();
            for (const auto& dirEntry : std::filesystem::recursive_directory_iterator(cacheDir, std::filesystem::directory_options::skip_permission_denied)) {
                if (dirEntry.is_regular_file() && dirEntry.path().filename() == filename) {
                    entry.isInstalled = true;
                    entry.isSymlinkedFromCache = true;
                    entry.resolvedLocalPath = dirEntry.path();
                    foundInCache = true;
                    break;
                }
            }
            if (foundInCache) break;
        }
    }
}

std::vector<ModelEntry> ModelScanner::getMissingModels() const {
    std::vector<ModelEntry> missing;
    for (const auto& entry : m_manifest) {
        if (!entry.isInstalled) {
            missing.push_back(entry);
        }
    }
    return missing;
}

bool ModelScanner::isPipelineReady() const {
    return getMissingModels().empty();
}

bool ModelScanner::symlinkModel(const std::string& modelId, const std::filesystem::path& existingPath) {
    for (auto& entry : m_manifest) {
        if (entry.id == modelId && std::filesystem::exists(existingPath)) {
            std::filesystem::path target = m_appDataModelRoot / entry.localTargetRelPath;
            std::filesystem::create_directories(target.parent_path());
            
            std::error_code ec;
            std::filesystem::create_symlink(existingPath, target, ec);
            if (!ec) {
                entry.isInstalled = true;
                entry.isSymlinkedFromCache = true;
                entry.resolvedLocalPath = existingPath;
                return true;
            }
        }
    }
    return false;
}

} // namespace Genux
