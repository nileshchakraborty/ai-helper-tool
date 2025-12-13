// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "MacInterviewCopilot",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(
            name: "MacInterviewCopilotApp",
            targets: ["MacInterviewCopilotApp"]
        )
    ],
    dependencies: [
        // Local dependency for the generated API client
        .package(path: "MacInterviewCopilot/Core/Networking/OpenAPIClient"),
        .package(url: "https://github.com/exPHAT/SwiftWhisper.git", branch: "master")
    ],
    targets: [
        .target(
            name: "MacInterviewCopilotLib",
            dependencies: [
                .product(name: "OpenAPIClient", package: "OpenAPIClient"),
                .product(name: "SwiftWhisper", package: "SwiftWhisper")
            ],
            path: "MacInterviewCopilot",
            exclude: [
                "Runner",
                "Core/Networking/OpenAPIClient"
            ],
            resources: [
                .process("Resources")
            ]
        ),
        .executableTarget(
            name: "MacInterviewCopilotApp",
            dependencies: ["MacInterviewCopilotLib"],
            path: "MacInterviewCopilot/Runner"
        ),
        .testTarget(
            name: "MacInterviewCopilotTests",
            dependencies: ["MacInterviewCopilotLib"],
            path: "Tests"
        )
    ]
)
