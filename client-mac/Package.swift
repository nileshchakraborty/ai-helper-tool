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
        .package(path: "MacInterviewCopilot/Core/Networking/OpenAPIClient")
    ],
    targets: [
        .executableTarget(
            name: "MacInterviewCopilotApp",
            dependencies: [
                .product(name: "OpenAPIClient", package: "OpenAPIClient")
            ],
            path: "MacInterviewCopilot",
            exclude: [
                "Core/Networking/OpenAPIClient"
            ],
            resources: [
                .process("Resources")
            ]
        ),
        .testTarget(
            name: "MacInterviewCopilotTests",
            dependencies: ["MacInterviewCopilotApp"],
            path: "Tests"
        )
    ]
)
