cmake_minimum_required(VERSION 3.24)
project(GenuxEngine VERSION 1.0.0 LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Optimization Flags
if(MSVC)
    add_compile_options(/W4 /WX- /O2 /Oi /Ot /GL /std:c++20 /permissive- /utf-8 /EHsc /Zc:preprocessor)
    add_link_options(/LTCG /OPT:REF /OPT:ICF)
    add_compile_definitions(NOMINMAX WIN32_LEAN_AND_MEAN _CRT_SECURE_NO_WARNINGS)
endif()

# Include Directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Core Sources
set(ENGINE_SOURCES
    src/main.cpp
    src/ModelScanner.cpp
    src/ModelDownloader.cpp
    src/VRAMManager.cpp
    src/SocialIngestor.cpp
    src/GemmaDirector.cpp
    src/RecastPipeline.cpp
)

set(ENGINE_HEADERS
    include/ModelScanner.hpp
    include/ModelDownloader.hpp
    include/VRAMManager.hpp
    include/SocialIngestor.hpp
    include/GemmaDirector.hpp
    include/RecastPipeline.hpp
)

add_executable(GenuxEngine ${ENGINE_SOURCES} ${ENGINE_HEADERS})

# Link WinHTTP, Crypt32 for native Windows multi-threaded download & SHA-256 verification
target_link_libraries(GenuxEngine PRIVATE
    winhttp
    crypt32
    ws2_32
)

message(STATUS "Configured GenuxEngine (Codename: Genuts Engine) with C++20 and Windows 11 SDK")
